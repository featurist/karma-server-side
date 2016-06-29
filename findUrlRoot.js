module.exports = function() {
  var scripts = document.querySelectorAll('script');

  var roots = {};

  // ie9
  if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
  }

  var origin = location.origin;

  Array.prototype.slice.call(scripts).map(function (scriptTag) {
    return scriptTag.src.replace(origin, '');
  }).filter(function (script) {
    return /\/base\//.test(script);
  }).forEach(function (script) {
    var match = /(.*?)\/base\//.exec(script);
    if (match) {
      var root = match[1];
      if (roots[root]) {
        roots[root]++;
      } else {
        roots[root] = 1;
      }
    }
  });

  var mostCommonRootNumber = 0;
  var mostCommonRootName;
  Object.keys(roots).forEach(function (root) {
    if (mostCommonRootNumber < roots[root]) {
      mostCommonRootName = root;
    }
  });

  return mostCommonRootName;
};
