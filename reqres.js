var io = require('socket.io-client');
var findUrlRoot = require('./findUrlRoot');

module.exports = function (event) {
  var messages = {};

  var messageIndex = 1;

  function messageId() {
    return Date.now() + ':' + messageIndex++;
  }

  var socket;

  function connect() {
    if (!socket) {
      socket = io(location.host, {
        reconnectionDelay: 500,
        reconnectionDelayMax: Infinity,
        timeout: 2000,
        path: findUrlRoot() + '/socket.io',
        'sync disconnect on unload': true
      });

      socket.on('server-side', function (msg) {
        messages[msg.id](msg);
      });
    }
  }

  return {
    send: function (msg) {
      connect();
      var id = messageId();
      msg.id = id;
      socket.emit(event, msg);

      return new Promise(function (fulfil) {
        messages[id] = fulfil;
      });
    }
  }
};
