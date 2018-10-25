window.onbeforeload = function(e){
	hangup();
}

var sendChannel, receiveChannel;
var sendButton = document.getElementById('sendButton');
var sendTextarea = document.getElementById('dataChannelSend');
var receiveTextarea = document.getElementById('dataChannelReceive');

var localVideo  =document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

//sendButton.onclick = sendData;

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;

var localStream;
var remoteStream;

var pc;

var pc_config = 
	{'iceServers':[{'urls':'stun:23.21.150.121'}]};
	//{'iceServers':[{'url':'stun:stun.l.google.com:19302'}]};

var pc_constraints = {
	'optional': [
	{'DtlsSrtpKeyAgreement':true}
	]};

var sdpCOnstraints = {};

var room = prompt('Enter room name: ');

var socket = io.connect("http://192.168.43.44:8181");

if(room != ''){
	console.log('create or join room', room);
	socket.emit('create or join', room);
}

//var constraints = {video: true, audio:true};
var constraints ={
	video:
	{
		mediaSource: "screen",
		width:{max:'720'},
		height: {max:'480'},
		framerate: {max: '10'}
	}
	}

function handleUserMedia(stream){ //getuserMedia
	console.log('Getting webcam video');
	localVideo.srcObject= stream;
	localStream = stream;
		
	sendMessage('got user media');
}

function handleUserMediaError(error){ //handle getUserMEdia Error
	console.log('navigator.mediaDevices.getUserMedia error', error);
}

socket.on('created',function(room){ //get initiator media upon room creation
	console.log('Created room ' + room);
	isInitiator = true;

	navigator.mediaDevices.getUserMedia(constraints)
		.then(handleUserMedia)
		.catch(handleUserMediaError);
	console.log('Getting user media with constraints', constraints);

	checkAndStart();
});

socket.on('full', function(room){ //handle room full
	console.log('Room ' + room + ' is full!');
});

socket.on('join', function(room){ //handle joining peer
	console.log('Another peer requesting to join room' + room);
	console.log('This peer is the initiator ' + room);
	isChannelReady = true;
});

socket.on('joined', function(room){
	console.log('This peer joined the room ' + room);
	isChannelReady = true;

	navigator.mediaDevices.getUserMedia(constraints)
		.then(handleUserMedia)
		.catch(handleUserMediaError);
	console.log('Getting User media with constraints', constraints);
});

socket.on('log', function(array){
	console.log.apply(console, array);
});

socket.on('message', function(message){
	console.log('Recieved message:', message);
	if(message === 'got user media'){
        console.log('msg got usr mda ' + isStarted + ' '+ isChannelReady );
		checkAndStart();
	}else if(message.type === 'offer' ){
		if(!isInitiator && !isStarted){
			checkAndStart();
		}
		pc.setRemoteDescription(new RTCSessionDescription(message));
		doAnswer();
	}else if(message.type === 'answer' && isStarted){
		pc.setRemoteDescription(new RTCSessionDescription(message));
	}else if(message.type === 'candidate' && isStarted){
		var candidate = new RTCIceCandidate({sdpMLineIndex: message.label,
			candidate:message.candidate});
		pc.addIceCandidate(candidate);
	}else if(message === 'bye' && isStarted){
		handleRemoteHangup();
	}else{
		console.log('walang pinasukan ');
	}
});

function sendMessage(message){
	console.log('Sending message', message);
	socket.emit('message', message);
}

function checkAndStart(){
	console.log('in check and start ' + isStarted + ' '+ isChannelReady );
	console.log(typeof localStream);
	if(!isStarted && typeof localStream !== 'undefined' && isChannelReady){
		createPeerConnection();
		isStarted = true;
		if(isInitiator){
			doCall();
		}
	}
}

function createPeerConnection(){
	try{
		const videoTracks = window.localStream.getVideoTracks();
		if(videoTracks.length > 0){
			console.log(`Using video device: ${videoTracks[0].label}`);
		}
		pc = new RTCPeerConnection(pc_config, pc_constraints);
		window.localStream.getTracks().forEach(track => pc.addTrack(track, window.localStream));
		pc.onicecandidate = handleIceCandidate;

		console.log('Created RTCPeerConnection with: \n' +
			' config: \'' + JSON.stringify(pc_config) + '\';\n' +
			' constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
	} catch (e){
		console.log('Failed to create PeerConnection, exception:' + e.message);
		alert('Cannot create RTCPeerConnection object.');
		return;
	}
	pc.ontrack = handleRemoteStreamAdded;
	pc.onremovestream = handleRemoteStreamRemoved;


}



function handleIceCandidate(event){
	console.log('handleIceCandidate event: ', event);
	if(event.candidate){
		sendMessage({
			type: 'candidate',
			label: event.candidate.sdpMLineIndex,
			id: event.candidate.sdpMid,
			candidate: event.candidate.candidate
		});
	}else{
		console.log('End of candidates');
	}
}

function doCall(){
	console.log('Creating offer....');
	pc.createOffer(setLocalAndSendMessage, onSignalingError, sdpCOnstraints);
}

function onSignalingError(error){
	console.log('Failed to create signaling message: ' + error.name);
}

function doAnswer(){
	console.log('Sending Answer to peer.');
	pc.createAnswer(setLocalAndSendMessage,onSignalingError,sdpCOnstraints);
}

function setLocalAndSendMessage(sessionDescription){
	pc.setLocalDescription(sessionDescription);
	sendMessage(sessionDescription);
}

function handleRemoteStreamAdded(event){
	console.log('Remote stream added.');
	remoteVideo.srcObject =  event.streams[0];
	console.log('Remote stream attached');
	remoteStream = event.streams[0];
}

function handleRemoteStreamRemoved(event){
	console.log('Remote stream removed. Event: ', event);
}

function hangup(){
	console.log('Hanging up.');
	stop();
	sendMessage('bye');
}


function handleRemoteHangup(){
	console.log('Session terminated');
	stop();
	isInitiator = false;
}

function stop(){
	isStarted = false;
	if(sendChannel) sendChannel.close();
	if(receiveChannel) receiveChannel.close();
	if(pc) pc.close();
	pc = nulll
	sendButton.disabled = true;
}

/*
	if(isInitiator){
		try{
			sendChannel = pc.createDataChannel("sendDataChannel",
				{reliable: true});
			trace('Created send data channel');
		}catch(e){
			alert('Failed to create data channel. ');
			trace('createDataChannel() failed with exception: ' +e.message);
		}
		sendChannel.onopen = handleSendChannelStateChange;
		sendChannel.onmessage = handleMessage;
		sendChannel.onclose = handleSendChannelStateChange;
	}else{
		pc.ondatachannel = gotReceieveChannel;
	}
	function sendData(){
	var data = sendTextarea.value;
	if(initiator) sendChannel.send(data);
	else receiveChannel.send(data);
	trace('Sent data: ' +data);
}

function gotReceiveChannel(event){
	trace('Receive Channel Callback');
	receiveChannel = event.channel;
	receiveChannel.onmessage = handleMessage;
	receiveChannel.onopen = handleReceiveChannelSateChange;
	receiveChannel.onclose = handleReceiveChannelSateChange;
}

function handleMessagee(event){
	trace('Received message: '+ event.data);
	receiveTextarea.value += event.data + '\n';
}

function handleSendChannelStateChange(){
	var readyState = sendChannel.readyState;
	trace('Send channel state is: ' + readyState);
	if(readyState == 'open'){
		dataChannelSend.disabled = false;
		dataChannelSend.focus();
		dataChannelSend.placeholder = "";
		sendButton.disabled = false;
	}else{
		dataChannelSend.disabled = true;
		sendButton.disabled = true;
	}
}

function handleReceiveChannelStateChange(){
	var readyState = receiveChannel.readyState;
	trace('Receive channel state is: ' + readyState);
	if(readyState == 'open'){
		dataChannelSend.disabled = false;
		dataChannelSend.focus();
		dataChannelSend.placeholder = "";
		sendButton.disabled = false;
	}else{
		dataChannelSend.disabled = true;
		sendButton.disabled = true;
	}
}
*/	