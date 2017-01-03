var parseFunction = require('parse-function');
var extend = require('lowscore/extend');
var server = require('./reqres');

function namedArguments(names, values) {
  var args = {};

  names.forEach(function (arg, index) {
    args[arg] = values[index];
  });

  return args;
}

exports.run = function () {
  var runArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
  var fnArg = arguments[arguments.length - 1];

  var fn = parseFunction(fnArg);
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
