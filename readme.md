# Karma Server Side

Ever wanted to interact with the host system when running karma tests? This module allows the tests running in your browser to do things on the server-side, that is, in node. This means you can run API or DB setup code from your tests inside karma.

Also, when you change your server-side files, they'll be reloaded on the next test run. No need to reload karma!

## install

```sh
npm install karma-server-side
```

Edit your `karma.conf.js` to look like this, add `server-side` to the `frameworks` array:

```js
module.exports = function(config) {
  config.set({

    ...

    frameworks: [..., 'server-side'],

    ...

  });
}
```

# usage

In your tests (in the browser):

```js
var server = require('karma-server-side');

server.run(function () {
  console.log('this is run on the server');
  return 'result';
}).then(function (result) {
  // result == 'result'
});
```

`run` returns a promise which completes when the function has executed on the server.

## require

You can require modules on the server side by using `serverRequire` or `require`. Note that if you use `require` and browserify, then browserify will try to resolve those modules and bundle them into the test code in the browser.

`serverRequire` and `require` requires files relative to the current working directory of karma, not from the current test file.

## promises

If you return a promise from the function passed to `run()` then `run()` will wait for it to complete.

```js
server.run(function () {
  var fs = serverRequire('fs-promise');
  return fs.readFile('afile.txt', 'utf-8');
}).then(function (fileContents) {
  // fileContents is the contents of afile.txt
});
```

## passing arguments

You can pass arguments to the function:

```js
server.run(1, 2, function (a, b) {
  return a + b;
}).then(function (result) {
  // result == 3
});
```

## run context

The `this` inside the function can be used to store values between calls to `run()`:

```js
server.run(function () {
  this.x = 'something';
}).then(function () {
  server.run(function () {
    return this.x;
  }).then(function (result) {
    // result == 'something'
  });
});
```

# Debug

`karma-server-side` uses [debug](https://github.com/visionmedia/debug) so you can see debug information by running karma with a `DEBUG=karma-server-side` variable:

```sh
DEBUG=karma-server-side karma start
```
