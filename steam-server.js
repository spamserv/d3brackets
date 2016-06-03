var express = require('express');
var http = require('http');
var steam = require('steam-web');
var app = express();
var port = 8081;
var server = http.createServer(app).listen(port);
var https = require('https');
var API_KEY = "988FF43E45F6E038286BEEAC22A3155B";
var steamClient = new steam({
  apiKey: API_KEY,
  format: 'json' //optional ['json', 'xml', 'vdf']
});

var steam_timestamp = "76561197960265728";

io = require('socket.io').listen(server);

io.on('connection', function (socket){
	console.log('connected');
	socket.on('steam info', function(steam_ids, callback){
		steamClient.getPlayerSummaries({
		  steamids: steam_ids,
		  callback: function(err, data) {
		    callback(data.response.players);
		  }
		});
	});	
});