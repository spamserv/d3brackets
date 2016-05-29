var express = require('express');
var app = express();
var http = require('http');
var port = 8081;
var server = http.createServer(app).listen(port);

io = require('socket.io').listen(server);

io.on('connection', function (socket){
	console.log('connected');
	socket.on('steam info', function(steam_ids, callback){
		callback("broj");
		
	});
});