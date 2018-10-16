

var localVideo =  document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var localPeerConnection;
var remotePeerConnection;
//variables for buttons
var startButton = document.getElementById("startButton");
var callButton = document.getElementById("callButton");
var hangupButton = document.getElementById("hangupButton");


//disable other buttons except call
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

//assign button onclick actions
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

function log(text) {
	console.log("At the time: " + (performance.now()/1000).toFixed(3) + "-->"  + text);
}

function SuccessCallback(stream){
	log("Received local stream");

	
	localVideo.srcObject=stream;
	window.localStream = stream;

	callButton.disabled = false;
}

function start() {
	log("Requesting local stream");

	startButton.disabled = true;
	//navigator.mediaDevices.getUserMedia/ = navigator.getUserMedia ||  navigator.webkitGetUserMedia;		 
	navigator.mediaDevices.getUserMedia({video:true})
			.then(SuccessCallback)
			.catch (function(error){log("Video not supported", error)});
	
}

//call function enabled after successful getuser media

function call() {
	callButton.disabled = true;
	hangupButton.disabled = false;

	log("Starting call");
	const videoTracks = window.localStream.getVideoTracks();
	if(videoTracks.length > 0){
		console.log(`Using video device: ${videoTracks[0].label}`);
	}
	/*if(localStream.getVideoTracks().length= 0){
		log("Using video device: " + localStream.getVideoTracks()[0].label);
	}
	if(navigator.webkitGetUserMedia){
		RTCPeerConnection = webkitRTCPeerConnection;
	}else{
		RTCPeerConnection = RTCPeerConnection;
		RTCSessionDescription = RTCSessionDescription;
		RTCIceCandidate = RTCIceCandidate;
	}*/
	log("RTCPeerConnection object" + RTCPeerConnection);
	var servers = null;
	//NAT Traversal

	localPeerConnection = new RTCPeerConnection(servers);
	log("Created local peer connection object localPeerConnection");
	remotePeerConnection = new RTCPeerConnection(servers);
	remotePeerConnection.ontrack = gotRemoteStream;
	log("Created local peer connection object remotePeerConnection");
	localPeerConnection.onicecandidate = gotLocalIceCandidate;
	remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
	
	window.localStream.getTracks().forEach(track => localPeerConnection.addTrack(track, window.localStream));
	//localPeerConnection.addStream(localStream);
	log("Added localStream to localPeerConnection");

	localPeerConnection.createOffer(gotLocalDescription, onSignalingError);
}

function onSignalingError(error){
	console.log("Failed to create signaling message: " + error.name);
}	

function gotLocalDescription(description){
	localPeerConnection.setLocalDescription(description);
	log("Offer from localPeerConnection: \n" + description.sdp);
	remotePeerConnection.setRemoteDescription(description);
	remotePeerConnection.createAnswer(gotRemoteDescription, onSignalingError);
}

function gotRemoteDescription(description){
	remotePeerConnection.setLocalDescription(description);
	log("Answer from remotePeerConnection: \m" + description.sdp);
	localPeerConnection.setRemoteDescription(description);
}

function hangup(){
	log("Ending call");
	localPeerConnection.close();
	remotePeerConnection.close();

	localPeerConnection = null;
	remotePeerConnection = null;

	hangupButton.disabled = true;
	callButton.disabled = false;
}	

function gotRemoteStream(e){
	if(remoteVideo.srcObject !== e.streams[0]){
	  remoteVideo.srcObject = e.streams[0];
	  log("Received remote stream");
	}
}
function gotLocalIceCandidate(event){
	if(event.candidate){
		remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		log("Local ICE candidate: \n" + event.candidate.candidate);
	}
}

	
function gotRemoteIceCandidate(event){
	if(event.candidate){
		localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		log("Remote ICE candidate: \n" + event.candidate.candidate);
	}
}	


