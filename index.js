var originalRequireCache = {};
var context = {};

function createFramework(emitter, io) {
  emitter.on('run_start', function () {
    originalRequireCache = Object.assign({}, require.cache);
  });

  emitter.on('run_complete', function () {
    Object.keys(require.cache).forEach(function (module) {
      if (!originalRequireCache[module]) {
        delete require.cache[module];
      }
    });
  });

  io.on('connection', function (socket) {
    socket.on('server-side', function (request) {
      run(request, function (error, result) {
        var response = {id: request.id};

        if (error) {
          response.error = serialiseError(error);
        } else {
          response.result = result;
        }

        socket.emit('server-side', response);
      });
    });
  });
}

function streamToJson(s, cb) {
  s.setEncoding("utf-8");
  var strings = [];

  s.on("data", function(d) {
    strings.push(d);
  });

  s.on("end", function() {
    cb(undefined, JSON.parse(strings.join("")));
  });

  s.on("error", function(e) {
    cb(e);
  });
};

function serverRequire(moduleName) {
  var modulePath = moduleName[0] == '.' ?  process.cwd() + '/' + moduleName: moduleName;
  return require(modulePath);
}

function run(request, cb) {
  var argumentNames = Object.keys(request.arguments);
  var argumentValues = argumentNames.map(function (name) {
    return request.arguments[name];
  });

  var fn = new Function(['serverRequire', 'require'].concat(argumentNames).join(', '), request.script);

  try {
    var result = fn.apply(context, [serverRequire, serverRequire].concat(argumentValues));

    function sendResult(result) {
      cb(undefined, result);
    }

    function sendError(error) {
      cb(error);
    }

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
