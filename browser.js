var parseFunction = require('parse-function');
var server = require('./reqres')('server-side');

function namedArguments(names, values) {
  var args = {};

  names.forEach(function (arg, index) {
    args[arg] = values[index];
  });

  return args;
}

exports.run = function (_fn) {
  var fn = parseFunction(arguments[arguments.length - 1]);
  var runArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);

  var args = namedArguments(fn.args, runArguments);

  return server.send({script: fn.body, arguments: args}).then(function (response) {
    if (response.error) {
      var error = new Error(response.error.message);
      Object.assign(error, response.error);
      throw error;
    } else {
      return response.result;
    }
  });
};
