var debug = require('debug')('karma-server-side');
var originalRequireCache;
var context = {};
var cwd = process.cwd();

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

  var serverSideIo = io.of('/karma-server-side');

  serverSideIo.on('connection', function (socket) {
    socket.on('server-side', function (request) {
      debug('run', request);
      run(request, function (error, result) {
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

function serverRequire(moduleName) {
  var modulePath = moduleName[0] == '.' ? cwd + '/' + moduleName: moduleName;
  debug('loading', modulePath);
  return require(modulePath);
}

function run(request, cb) {
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

module.exports = {
  'framework:server-side': [ 'factory', createFramework ]
};
