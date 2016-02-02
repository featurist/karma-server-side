var originalRequireCache = {};
var context = {};

function createFramework(emitter) {

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
}

function streamToString(s, cb) {
  s.setEncoding("utf-8");
  var strings = [];

  s.on("data", function(d) {
    strings.push(d);
  });

  s.on("end", function() {
    cb(undefined, strings.join(""));
  });

  s.on("error", function(e) {
    cb(e);
  });
};

function serverRequire(moduleName) {
  var modulePath = moduleName[0] == '.' ?  process.cwd() + '/' + moduleName: moduleName;
  return require(modulePath);
}

function createMiddleware() {
  return function(req, res, next) {
    if (req.url == '/blah' && req.method == 'POST') {
      streamToString(req, function (error, script) {
        res.setHeader('Content-Type', 'application/json');

        var fn = new Function('serverRequire', 'require', script);

        try {
          var result = fn.call(context, serverRequire, serverRequire);

          function sendResult(result) {
            res.end(JSON.stringify({result: result}));
          }

          function sendError(error) {
            res.statusCode = 500;
            res.end(JSON.stringify({error: error}));
          }

          if (result && typeof result.then === 'function') {
            result.then(sendResult, sendError);
          } else {
            sendResult(result);
          }
        } catch (error) {
          console.error(serialiseError(error));
          sendError(serialiseError(error));
        }
      });
    } else {
      next();
    }
  };
}

function serialiseError(error) {
  var s = Object.assign({}, error);
  s.message = error.message;
  s.stack = error.stack;
  s.name = error.name;
  return s;
}

createFramework.$inject = ['emitter'];

module.exports = {
  'framework:server-side': [ 'factory', createFramework ],
  'middleware:server-side': [ 'factory', createMiddleware ]
};
