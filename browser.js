var http = require('httpism');
var parseFunction = require('parse-function');

exports.urlRoot = '/';

function namedArguments(names, values) {
  var args = {};

  names.forEach(function (arg, index) {
    args[arg] = values[index];
  });

  return args;
}

exports.run = function (_fn) {
  var fn = parseFunction(_fn);
  var runArguments = Array.prototype.slice.call(arguments, 1);
  var url = exports.urlRoot + 'server-side';

  var args = namedArguments(fn.args, runArguments);

  return http.post(url, {script: fn.body, arguments: args}).then(function (response) {
    return response.body.result;
  }, function (response) {
    if (response.statusCode == 500) {
      var error = new Error(response.body.error.message);
      Object.assign(error, response.body.error);
      throw error;
    }
  });
};
