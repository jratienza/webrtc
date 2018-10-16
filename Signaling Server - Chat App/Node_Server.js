var static = require('node-static');
var http = require('http');
var file = new(static.Server)();

var app = http.createServer(function(req, res){
	file.serve(req, res);
}).listen(8181);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket){
	socket.on('message', function(message){
		log('S--> Got message', message);

		socket.broadcast.to(message.channel).emit('message', message.message);
	});

	socket.on('create or join', function(channel){
		var numClients = io.of('/').in(channel).clients.length;
		console.log('numClients = ' + numClients);

		if(numClients == 0){
			socket.join(channel);
			socket.emit('created', channel);
			console.log('numClients = ' + numClients);
		}else if(numClients == 1){
			io.sockets.in(channel).emit('remotePeerJoining', channel);
			socket.join(channel);
			console.log('numClients = ' + numClients);
			socket.broadcast.to(channel).emit('broadcast: joined',	'S---> broadcast(): client ' + socket.id + 'joined channel ' + channel);
		}else{
			console.log('Channel FUll');
			socket.emit('full', channel);
		}
	});

	socket.on('response', function(response){
		log('S --> Got reply: ', response);

		socket.broadcast.to(response.channel).emit('response',response.message);
	});
	socket.on('Bye', function(channel){
		socket.broadcast.to(channel).emit('Bye');
		socket.disconnect();
	});

	socket.on('Ack', function(){
		console.log('Got an Ack!');
		socket.disconnect();
	});

	function log(){
		var array = [">>> "];
		for (var i =0; i <arguments.length; i++){
			array.push(arguments[i]);
		}
		socket.emit('log', array);
	}

});