var parseFunction = require('parse-function');
var extend = require('lowscore/extend');
var serverRequire = require('./serverRequire');

function namedArguments(names, values) {
  var args = {};

  names.forEach(function (arg, index) {
    args[arg] = values[index];
  });

  return args;
}

var context = {};

exports.run = function () {
  var runArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
  var fnArg = arguments[arguments.length - 1];

  var fn = parseFunction(fnArg);
  var args = namedArguments(fn.args, runArguments);

  if (typeof window != 'undefined' && window.__karma__) {
    var server = require('./reqres');

    return server.send({script: fn.body, arguments: args}).then(function (response) {
      if (response.error) {
        var error = new Error(response.error.message);
        extend(error, response.error);
        throw error;
      } else {
        return response.result;
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      var runFn = new Function(['serverRequire'].concat(fn.args).join(', '), fn.body);
      var result = runFn.apply(context, [serverRequire].concat(runArguments));

      if (result && typeof result.then == 'function') {
        return result.then(resolve).catch(reject);
      } else {
        return resolve(result);
      }
    })
  }
};
