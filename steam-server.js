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

var match_history = [];
var player_xpm = [];
var player_gpm = [];
var steam_timestamp = 76561197960265728;


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

	socket.on('get steam account info', function(steam_id){
		getMatchHistory(steam_id);
		getMatchDetails(steam_id, match_history);
	});


	function getMatchHistory(steam_id) {
		var match_ids = [];
		var options = {
			host: 'api.steampowered.com',
 			path: '/IDOTA2Match_570/GetMatchHistory/V001/?account_id='+steam_id+'&key='+API_KEY
		};

		callback = function(response) {
		  var str = '';

		  response.on('data', function (chunk) {
		    str += chunk;
		  });

		  response.on('end', function () {
		  	var json = JSON.parse(str);
		  	matches = json.result.matches;
		    for(var i=0; i<matches.length; i++){	
		    	match_history.push(matches[i].match_id);
		    	if(i>=10) {
		    		match_history = [];
		    		return;
		    	}
		    }
		  });
		}

		https.request(options, callback).end();
	}

	function getMatchDetails(steam_id, match_history) {
		steam32_id = steam_id - steam_timestamp;
		while((match_id=match_history.pop()) != null){  
			var options = {
				host: 'api.steampowered.com',
	 			path: '/IDOTA2Match_570/GetMatchDetails/V001/?match_id='+match_id+'&key='+API_KEY
			};

			callback = function(response) {
			  var str = '';

			  response.on('data', function (chunk) {
			    str += chunk;
			  });

			  response.on('end', function () {
			  	//console.log(str);
			  	var json = JSON.parse(str);
			  	players = json.result.players;
			  	for(var key in players) {
			  		player_xpm.push(players[key].gold_per_min);
			  		player_gpm.push(players[key].xp_per_min);
			  	}
			  	console.log(player_xpm);
			  	console.log(player_gpm);
			  });
			}

			https.request(options, callback).end();
		}
	}
});