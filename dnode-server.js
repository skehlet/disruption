#!/usr/bin/env node

var config = require('./config');
var disruption = require('./disruption');
var express = require('express');
var dnode = require('dnode');

var app = express.createServer();
app.use(express.static(__dirname + '/htdocs'));
app.listen(config.dnodeServerPort);
console.log('Disruption dnode server listening on localhost:' + config.dnodeServerPort);

var server = dnode(function(remote, conn) {
  var _disruption;
  console.log(conn.id + ' connected');
  conn.on('end', function() {
    if (_disruption) {
      _disruption.end();
    }
    console.log(conn.id + ' dropped connection.');
  });

  _disruption = disruption.connect({
    id: conn.id,
    realm: config.disruptionRealm,
    host: config.redisHost,
    port: config.redisPort
  });

  // proxy these methods
  this.subscribe = _disruption.subscribe;
  this.send = _disruption.send;
  this.handle = _disruption.handle;
  this.monitor = _disruption.monitor;
});
server.listen(app);
