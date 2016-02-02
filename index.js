var originalRequireCache = {};
var context = {};
var config;

function createFramework(emitter, _config) {
  config = _config;

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

function createMiddleware() {

  return function(req, res, next) {
    var url = config.urlRoot + 'server-side';
    if (req.url == url && req.method == 'POST') {
      streamToJson(req, function (error, body) {
        res.setHeader('Content-Type', 'application/json');

        var argumentNames = Object.keys(body.arguments);
        var argumentValues = argumentNames.map(function (name) {
          return body.arguments[name];
        });

        var fn = new Function(['serverRequire', 'require'].concat(argumentNames).join(', '), body.script);

        try {
          var result = fn.apply(context, [serverRequire, serverRequire].concat(argumentValues));

          function sendResult(result) {
            res.end(JSON.stringify({result: result}));
          }

          function sendError(error) {
            res.statusCode = 500;
            res.end(JSON.stringify({error: serialiseError(error)}));
          }

          if (result && typeof result.then === 'function') {
            result.then(sendResult, sendError);
          } else {
            sendResult(result);
          }
        } catch (error) {
          sendError(error);
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

createFramework.$inject = ['emitter', 'config'];

module.exports = {
  'framework:server-side': [ 'factory', createFramework ],
  'middleware:server-side': [ 'factory', createMiddleware ]
};
