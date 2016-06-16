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

server = require('http').createServer(app);
io = require('socket.io').listen(server);

server.listen(process.env.PORT || 5000);

app.get('/', function (req, res) {
      res.header('Content-type', 'text/html');
      return res.end('<h1>Hello, Secure World!</h1>');
});

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