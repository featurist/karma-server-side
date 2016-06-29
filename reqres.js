var io = require('socket.io-client');
var findUrlRoot = require('./findUrlRoot');

var messages = {};

var messageIndex = 1;

function messageId() {
  return Date.now() + ':' + messageIndex++;
}

var socket = io('/karma-server-side', {
  reconnectionDelay: 500,
  reconnectionDelayMax: Infinity,
  timeout: 2000,
  path: findUrlRoot() + '/socket.io',
  'sync disconnect on unload': true,
  transports: ['polling', 'websocket']
});

socket.on('server-side', function (msg) {
  messages[msg.id](msg);
});

module.exports = {
  send: function (msg) {
    var id = messageId();
    msg.id = id;
    socket.emit('server-side', msg);

    return new Promise(function (fulfil) {
      messages[id] = fulfil;
    });
  }
};
