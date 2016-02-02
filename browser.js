var http = require('httpism');
var parseFunction = require('parse-function');

exports.run = function (fn) {
  var s = typeof fn === 'function'? parseFunction(fn).body: fn;

  return http.post('/blah', s).then(function (response) {
    return response.body.result;
  }, function (response) {
    if (response.statusCode == 500) {
      var error = new Error(response.body.error.message);
      Object.assign(error, response.body.error);
      throw error;
    }
  });
};
