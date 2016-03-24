var parseFunction = require('parse-function');
var server = require('./reqres');
var extend = require('lowscore/extend');

function namedArguments(names, values) {
  var args = {};

  names.forEach(function (arg, index) {
    args[arg] = values[index];
  });

  return args;
}

exports.run = function () {
  var fn = parseFunction(arguments[arguments.length - 1]);
  var runArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);

  var args = namedArguments(fn.args, runArguments);

  return server.send({script: fn.body, arguments: args}).then(function (response) {
    if (response.error) {
      var error = new Error(response.error.message);
      extend(error, response.error);
      throw error;
    } else {
      return response.result;
    }
  });
};
