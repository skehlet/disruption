var redis = require('redis'); // npm install redis
var uuid = require('node-uuid'); // npm install node-uuid

exports.connect = function(options) {
  var id = options.id || uuid();
  var realm = options.realm || 'default';
  var host = options.host || '127.0.0.1';
  var port = options.port || 6379;
  var pub = redis.createClient(port, host);
  var sub = redis.createClient(port, host);
  var handlers = {};

  function buildChannelName(channel) {
    return 'disruption-' + realm + '-' + channel;
  }
  
  function publish(to, subject, data) {
    var message = {
      time: new Date().getTime(),
      sender: id,
      subject: subject,
      data: data
    };
    var serializedMessage = JSON.stringify(message);
    pub.publish(buildChannelName(to), serializedMessage);
  }
  
  function handleSerializedMessage(serializedMessage) {
    var message;
    try {
      message = JSON.parse(serializedMessage);
    } catch (err) {
      console.log('received bad JSON message, skipping: ' + serializedMessage);
    }
    if (message.sender == id) return; // ignore self
    if (handlers[message.subject]) {
      for (var i = 0; i < handlers[message.subject].length; i++) {
        handlers[message.subject][i](message);
      }
    }
  }

  sub.on('message', function(channel, serializedMessage) {
    console.log('message handler fired, channel: ' + channel + ', message:' + serializedMessage);
    handleSerializedMessage(serializedMessage);
  });
  sub.subscribe(buildChannelName(id));
  
  var api = {};
  api.subscribe = function(channel) {
    sub.subscribe(buildChannelName(channel));
  }
  
  api.send = function(to, subject, data) {
    publish(to, subject, data);
  };
  
  api.handle = function(subject, fn) {
    if (!handlers[subject]) {
      handlers[subject] = [];
    }
    handlers[subject].push(fn);
  }
  
  api.monitor = function(fn) {
    var monitor = redis.createClient(port, host);
    monitor.monitor(function(err, res) {
      if (err) throw err;
    });
    monitor.on('monitor', function(time, args) {
      fn(time, args);
    });
  }
  
  api.end = function() {
    pub.end();
    sub.end();
  }
  
  return api;
};