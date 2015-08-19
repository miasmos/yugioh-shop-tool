var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var path = require('path');
var db = require('./db.js');

db.connect();

app.use('/', express.static(__dirname + '/html'));
app.get('/', function(req,res) {
	res.sendFile(path.join(__dirname, './html', 'index.html'));
});

io.on('connection', function(socket) {
	console.log('user connected');

	socket.on('cards-req', function(msg) {
		var cnt = 0;
		for (var m in msg) {
			db.getCard(msg[m][0], m, function(err, data){
				cnt++;
				var index = typeof data === 'object' ? data.index : data;

				if (!err && data && typeof data === 'object') {
					msg[index][0] = data.source;
					msg[index][2] = data.rarity;
				} else if (err || !data || typeof data !== 'object') {
					msg[index][0] = -1;
				}

				if (cnt > msg.length-1) {
					//done fetching cards, send it back
					socket.emit('cards-res', msg);
				}
			});
		}
	});

	socket.on('error', function(err) {
		throw err;
	});
});

http.listen(80);