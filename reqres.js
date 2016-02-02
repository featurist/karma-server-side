var io = require('socket.io-client')();

module.exports = function (event) {
  var messages = {};

  var messageIndex = 1;

  function messageId() {
    return Date.now() + ':' + messageIndex++;
  }

  io.on('server-side', function (msg) {
    messages[msg.id](msg);
  });

  return {
    send: function (msg) {
      var id = messageId();
      msg.id = id;
      io.emit(event, msg);

      return new Promise(function (fulfil) {
        messages[id] = fulfil;
      });
    }
  }
};
