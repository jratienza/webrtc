var static = require('node-static');
var http = require('http');

var file = new(static.Server)();

var app = http.createServer(function (req, res){
	file.serve(req, res);
}).listen(8181);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket){
	socket.on('message', function (message){
		log('S --> got message: ', message);
		log(message.channel);
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function(room){
		var clientsInRoom = io.nsps['/'].adapter.rooms[room];
			var numClients = clientsInRoom === undefined ? 0 : Object.keys(clientsInRoom.sockets).length;
		//var numClients = io.of('/').in(room).clients.length;

		log('S --> Room ' + room + ' has '+ numClients + ' client(s)');
		log('S --> Request to create or join room', room);

		if(numClients == 0){
			log('S--> if statement1 true');
			socket.join(room);
			socket.emit('created', room);
		}else if(numClients == 1){
			log('S--> elseif statement1 true');
			io.sockets.in(room).emit('join',room);
			socket.join(room);
			socket.emit('joined', room);
		}else{
			log('S--> else statement1 true');
			socket.emit('full', room);
		}
	});
	function log(){
		var array = [">>> "];
		for (var i = 0; i < arguments.length; i++){
			array.push(arguments[i]);
		}
		socket.emit('log', array);
	}
});