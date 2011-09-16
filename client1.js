#!/usr/bin/env node

var config = require('./config');

var disruption = require('./disruption').connect({ 
  id: 'client1',
  realm: config.disruptionRealm,
  host: config.redisHost,
  port: config.redisPort
});
