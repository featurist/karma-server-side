var debug = require('debug')('karma-server-side');
var originalRequireCache;
var context = {};
var cwd = process.cwd();
var serverRequire = require('./serverRequire');
var parseFunction = require('parse-function');

// parse-function is now ES6, it may export "default"
parseFunction = (parseFunction.default || parseFunction)().parse;

function isLocalModule(filename) {
  return filename.indexOf(cwd) != -1 && !filename.match(/[/\\]node_modules[/\\]/);
}

function createFramework(emitter, io) {
  emitter.on('run_start', function () {
    // Store originalRequireCache once when Karma starts.
    // To prevent the situation where second 'run_start' (e.g. user clicked karma Debug button)
    // marks application modules as "cached" and never unloads them again.
    if (!originalRequireCache) {
      originalRequireCache = Object.assign({}, require.cache);
    }
  });

  emitter.on('run_complete', function () {
    Object.keys(require.cache).forEach(function (module) {
      if (!originalRequireCache[module] && isLocalModule(module)) {
        debug('unloading', module);
        delete require.cache[module];
      }
    });
  });

  io.on('connection', function (socket) {
    socket.on('server-side', function (request) {
      debug('run', request);
      serverSideRun(request, function (error, result) {
        var response = {id: request.id};

        if (error) {
          debug('error', error);
          response.error = serialiseError(error);
        } else {
          debug('result', result);
          response.result = result;
        }

        socket.emit('server-side', response);
      });
    });
  });
}

function serverSideRun(request, cb) {
  var argumentNames = Object.keys(request.arguments);
  var argumentValues = argumentNames.map(function (name) {
    return request.arguments[name];
  });

  var fn = new Function(['serverRequire', 'require'].concat(argumentNames).join(', '), request.script);

  function sendResult(result) {
    cb(undefined, result);
  }

  function sendError(error) {
    cb(error);
  }

  try {
    var result = fn.apply(context, [serverRequire, serverRequire].concat(argumentValues));

    if (result && typeof result.then === 'function') {
      result.then(sendResult, sendError);
    } else {
      sendResult(result);
    }
  } catch (error) {
    sendError(error);
  }
}

function serialiseError(error) {
  var s = Object.assign({}, error);
  s.message = error.message;
  s.stack = error.stack;
  s.name = error.name;
  return s;
}

createFramework.$inject = ['emitter', 'socketServer'];

function run() {
  var runArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
  var fnArg = arguments[arguments.length - 1];

  var fn = parseFunction(fnArg);

  return new Promise(function(resolve, reject) {
    var runFn = new Function(['serverRequire'].concat(fn.args).join(', '), fn.body);
    var result = runFn.apply(context, [serverRequire].concat(runArguments));

    if (result && typeof result.then == 'function') {
      return result.then(resolve).catch(reject);
    } else {
      return resolve(result);
    }
  })
}

module.exports = {
  'framework:server-side': [ 'factory', createFramework ],
  run: run
};
