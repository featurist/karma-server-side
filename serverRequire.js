var debug = require('debug')('karma-server-side');

module.exports = function serverRequire(moduleName) {
  var modulePath = moduleName[0] == '.' ? process.cwd() + '/' + moduleName: moduleName;
  debug('loading', modulePath);
  return require(modulePath);
}
