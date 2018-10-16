
div = document.getElementById('scratchPad');

var socket = io.connect('http://192.168.43.44:8181');

channel = prompt("Enter Channel Name: ");

if(channel !== ""){
	console.log("Trying to create or join channel", channel);
	socket.emit('create or join', channel);
}

socket.on("created", function(channel){
	console.log("channel " + channel + "has been created!");
	console.log("You created the  channel");

	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> Channel'
		+ channel + 'has been created. </p>');

	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> created the channel</p>');
});

socket.on('full', function(channel){
	console.log('channel '+ channel + 'is full  You cannot enter');

	div.insertAdjacentHTML('beforeEnd',  '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> \
		 channel '+  channel + 'is full');

});



socket.on('remotePeerJoining', function (channel){
	console.log('Request to join' + channel);
	console.log('You are the initiator!');

	div.insertAdjacentHTML('beforeEnd', '<p style="color:red">Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> Message from server: \
		reques to join channel' + channel + '</p>');

});


socket.on('joined', function(msg){
	console.log('Message from server: ' +msg);

	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> created the channel</p>');
	div.insertAdjacentHTML('beforeEnd', '<p style="color:blue">'+ msg+ '</p>');

	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> created the channel</p>');
	div.insertAdjacentHTML('beforeEnd', '<p style="color:blue">'+ msg+ '</p>');

});


socket.on('broadcast: joined', function(msg){
	div.insertAdjacentHTML('beforeEnd', '<p style="color:red"> Time: ' +
		(performance.now() / 1000).toFixed(3) +
		 '--> Broadcast Message from server: </p>');
	div.insertAdjacentHTML('beforeEnd', '<p style="color:red">'+ msg+ '</p>');
	console.log('Broadcast Message from server: ' +msg);

	var myMessage = prompt('Type Here: ', "");
	socket.emit('message', {
		channel: channel,
		message: myMessage
	});
});


socket.on('log', function(array){
	console.log.apply(console, array);
});


socket.on('message', function(message){
	console.log('Got peer message: ' + message);
	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> Got message: </p> ');
	div.insertAdjacentHTML('beforeEnd', '<p style="color:blue">' + message +
		'</p>');
	var myResponse = prompt('Reply: ', "");

	socket.emit('response', {
		channel:channel,
		message: myResponse
	});
});

socket.on('response', function(response){
	console.log('Got peer message: ' + response);
	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> Got reply: </p>');
	div.insertAdjacentHTML('beforeEnd', '<p style="color:blue">' + response +
		'</p>');
	var chatMsg = prompt('Keep on chatting. Type "Bye" to quit', "");


	if(chatMsg == "Bye"){
		div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> Sending "Bye" to server </p>');
		console.log('Sending Bye');
		socket.emit('Bye', channel);
		div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + 'Disconnecting');
		console.log('Disconnecting')
		socket.disconnect();

	}else{

	socket.emit('response', {
		channel:channel,
		message: chatMsg
		});
	}
});

socket.on('Bye', function(){
	console.log('Recieved "Bye". Disconnecting');

	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + '--> Recieved Bye </p> ');
	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + 'Sending ACK to server</p> ');
	console.log('Sending ACK to server');

	socket.emit('Ack')

	div.insertAdjacentHTML('beforeEnd', '<p>Time: ' +
		(performance.now() / 1000).toFixed(3) + 'Disconnecting');
		console.log('Disconnecting')
		socket.disconnect();
});
