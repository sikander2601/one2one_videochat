import React from "react";
import io from 'socket.io-client';
import kurentoUtils from 'kurento-utils';
import '../CSS/Home.css';
import {VideoPlayer} from "../presentationalComponent/VideoPlayer";
import {Chat} from "./Chat";

const socketUrl = 'http://localhost:8443';
const socket = io(socketUrl);

let webRtcPeer;


const NO_CALL = 0;
const PROCESSING_CALL = 1;
const IN_CALL = 2;


export class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            //username: null,
            videoInput: null,
            videoOutput: null,
            //registerState: NOT_REGISTERED,
            callState: NO_CALL,
            message: [],
            localStream : null,
            remoteStream: [],
        }
        this.setLocalStreamURL = this.setLocalStreamURL.bind(this);
        this.Call = this.Call.bind(this);
        this.stop = this.stop.bind(this);
        this.setBroadcastStreamURL = this.setBroadcastStreamURL.bind(this);
    };


    sendMessage = (message) => {
        var jsonMessage = JSON.stringify(message);
        console.log('Senging message: ' , message);
        socket.emit('message',jsonMessage);
    }

    /*
    Register = () => {

        console.log(socket);

        //this.setState ({socket});
        //this.setState ({user: });
        //this.socket.emit("Registered");

        var name = document.getElementById('name').value;
        console.log(name);
        if (name === '') {
            window.alert("You must insert your user name");
            return;
        }

        var message = {
            id : 'register',
            name : name
        };
        this.setState({registerState: REGISTERING});
        this.sendMessage(message);
    };*/

    componentDidMount() {

        this.webinarId = this.props.match.params.webinarId // roomID
        this.userId = this.props.match.params.profileId   // userID
        console.log("test params ::", this.webinarId, this.userId);

        this.setState({
            videoInput: document.getElementById('videoInput'),
            videoOutput: document.getElementById('videoOutput'),
        });

        let roomParams = {webinarId: this.webinarId, userId: this.userId}

        socket.on('connect', ()=>{
            console.log('connected');
            socket.emit("joinRoom",roomParams )
        });

        socket.on('chat',(data)=> {
            console.log(data);
            this.recieveChat(data);
        });

        socket.on('message', (data) => {
            var parsedMessage = JSON.parse(data);

            switch (parsedMessage.id) {
                case 'roomJoined':
                      console.log("roomJoined :: ",parsedMessage.roomLength);
                      if(parsedMessage.roomLength === 2 ){
                        console.log("startCall" + parsedMessage.roomLength);
                        this.Call();
                      }
                      break;
                case 'callResponse':
                      this.callResponse(parsedMessage);
                      break;
                case 'incomingCall':
                      console.log('Call is coming.')
                      this.incomingCall(parsedMessage);
                      break;
                case 'startCommunication':
                      console.log("starting  to communicate");
                      this.startCommunication(parsedMessage);
                      break;
                case 'stopCommunication':
                      console.info("Communication ended by remote peer");
                      this.stop(true);
                      break;
                case 'iceCandidate':
                      webRtcPeer.addIceCandidate(parsedMessage.candidate);
                      break;
            default:
            console.error('Unrecognized message', parsedMessage);
        }
        });
        console.log(socket);
    };

    setLocalStreamURL(webrtcpeerobj) {
        let localMediaStream = webrtcpeerobj.getLocalStream();
            if (localMediaStream) {
            let uri = URL.createObjectURL(localMediaStream);
            //console.log("LiveBroadcast::presenter/viewer:: interval clearing interval",uri);
            console.log("Localstream ", uri);
                this.setState({ localStream: uri });
            // clearInterval(refreshIntervalId);
        } else {
            localMediaStream = webrtcpeerobj.getLocalStream();
            // //console.log("LiveBroadcast::presenter/viewer:: interval not yet cleared ",localMediaStream, wertcpeerobj);
        }
    }

    setBroadcastStreamURL(event, mediatype) {
        let uri = URL.createObjectURL(event.stream);

            let temp = this.state.remoteStream;
            temp.push(uri);
            this.setState({ remoteStream:temp });
            console.log("Remote stream :: ", uri);
            
    }

    Call = () =>{
        console.log("Call()");

        /*if (document.getElementById('peer').value === '') {
            window.alert("You must specify the peer name");
            return;
        }*/

        this.setState({callState: PROCESSING_CALL});
        //console.log("stateofcall"+" "+callState);
        //showSpinner(videoInput, videoOutput);

        var options = {
            mediaConstraints: {
                audio: true,
                video: {
                    width: {
                        min: "640",
                        max: "1240"
                    },
                    height: {
                        min: "480",
                        max: "720"
                    }
                }
            },
            onicecandidate : this.onIceCandidate.bind(this)
        }
        var tis = this;

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(
            error) {    
            if (error) {
                console.error(error);
                tis.setState({callState: NO_CALL});
            }
            tis.setLocalStreamURL(this);
            //console.log(tis);
            this.generateOffer(function(error, offerSdp) {
                if (error) {
                    console.error(error);
                    tis.setState({callState: NO_CALL});
                }

                var message = {
                    id : 'call',
                    roomId: tis.webinarId,
                    from : this.userId,
                    //to : document.getElementById('peer').value,
                    sdpOffer : offerSdp
                };
                //console.log(message);
                tis.sendMessage(message);
            })
        });
    }

    stop(message){
            this.setState({ callState: NO_CALL});
            if (webRtcPeer) {
                webRtcPeer.dispose();
                webRtcPeer = null;

                if (!message) {
                     message = {
                        id : 'stop'
                    }
                    this.sendMessage(message);
                }
            }
            //hideSpinner(videoInput, videoOutput);
    }

    componentWillUnmount(){
       this.socket.close();
    }

    /*resgisterResponse(message) {
        if (message.response === 'accepted') {
            console.log("User Registered "+message.response);
            var name = document.getElementById('name');
            this.setState({
                username: name,
                registerState: REGISTERED});
        } else {
            this.setState({registerState: NOT_REGISTERED});
            var errorMessage = message.message ? message.message
                : 'Unknown reason for register rejection.';
            console.log(errorMessage);
            alert('Error registering user. See console for further information.');
        }
    }*/

    callResponse(message) {
        if (message.response !== 'accepted') {
            console.info('Call not accepted by peer. Closing call');
            var errorMessage = message.message ? message.message
                : 'Unknown reason for call rejection.';
            console.log(errorMessage);
            this.stop(true);
        } else {
            this.setState({callState: IN_CALL});
            webRtcPeer.processAnswer(message.sdpAnswer);
            this.setBroadcastStreamURL
        }
        console.log('callResponse');
    }

    incomingCall(message) {
        //If bussy just reject without disturbing user
        //console.log('inComing call()', this.state.callState);
        console.log("incomingCall()");

        if (this.state.callState != NO_CALL) {
            var response = {
                id : 'incomingCallResponse',
                from : message.from,
                callResponse : 'reject',
                message : 'bussy'

            };
            console.log(1111111114444);
            return this.sendMessage(response);
        }

        this.setState({callState: PROCESSING_CALL });
        if (window.confirm('User ' , message.from
            , ' is calling you. Do you accept the call?')) {
            //showSpinner(videoInput, videoOutput);

            var options = {
                mediaConstraints: {
                    audio: true,
                    video: {
                        width: {
                            min: "640",
                            max: "1240"
                        },
                        height: {
                            min: "480",
                            max: "720"
                        }
                    }
                },
                onicecandidate : this.onIceCandidate.bind(this)
            }

            var tis = this;
    
            let setRemoteStreamURL = function (event) { tis.setBroadcastStreamURL(event); };
            webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
                function(error) {
                    if (error) {
                        console.error(error);
                        tis.setState({callState: NO_CALL});
                    }
                    console.log(this.peerConnection);
                    this.peerConnection.onaddstream = setRemoteStreamURL;
                    tis.setLocalStreamURL(this);
                    this.generateOffer(function(error, offerSdp) {
                        if (error) {
                            console.error(error);
                            //tis.setState({callState: NO_CALL});
                        }
                        var response = {
                            id : 'incomingCallResponse',
                            from : message.from,
                            callResponse : 'accept',
                            sdpOffer : offerSdp,
                            roomId: tis.webinarId,
                            to: tis.userId,
                        };
                        console.log("sending sdpOffer ::", response)
                        tis.sendMessage(response);
                    });
                });

        }

        else {
            var response = {
                id : 'incomingCallResponse',
                from : message.from,
                callResponse : 'reject',
                message : 'user declined'
            };
            console.log(1112323232);
            this.sendMessage(response);
            this.stop(true);
        }
        //console.log(this.state);
    }

    startCommunication(message) {
        this.setState({callState: IN_CALL});
        console.log("startCommunication :: ",message.sdpAnswer );
        webRtcPeer.processAnswer(message.sdpAnswer);
        console.log("media url :: " + webRtcPeer.url);
    }

    onIceCandidate(candidate) {
        console.log('Local candidate' , JSON.stringify(candidate));
        console.log(this);
        var message = {
            roomId: this.webinarId,
            userId: this.userId,
            id : 'onIceCandidate',
            candidate : candidate
        }
        console.log('onIceCandidate :: '+ message.candidate);
        this.sendMessage(message);
    }

    sendChat(){
        var msg= document.getElementById('message').value;
        console.log(this.state.message);
        socket.emit('chat', msg );
    }

    recieveChat(msg){
        var prevState= this.state;
        this.setState(prevState => ({
            message: [...prevState.message, msg]
        }));    }

    render(){
        console.log('STATE ', this.state);
        return(
            <div>
                <VideoPlayer urls = {[this.state.localStream, this.state.remoteStream[0]]} />
            </div>
        );
    }
}