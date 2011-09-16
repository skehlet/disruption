#!/usr/bin/env node

var config = require('./config'),
  redis = require('redis'),
  client = redis.createClient(config.redisPort, config.redisHost);


client.on('pmessage', function(pattern, channel, message) {
  console.log('[' + pattern + "][" + channel + "]: " + message);
});

console.log("waiting for messages...");
client.psubscribe("*"); 
