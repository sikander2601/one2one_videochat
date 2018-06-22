import React from "react";
import io from 'socket.io-client';
import kurentoUtils from 'kurento-utils';

//import { Chat } from "./Chat";

const socketUrl = 'http://localhost:8443';
const socket = io(socketUrl);

var webRtcPeer;

const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;

const NO_CALL = 0;
const PROCESSING_CALL = 1;
const IN_CALL = 2;


export class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: null,
            videoInput: null,
            videoOutput: null,
            registerState: NOT_REGISTERED,
            callState: NO_CALL,
            message: [],
        }
    };
        this.Call = this.Call.bind(this);
        this.stop = this.stop.bind(this);
    };


    sendMessage = (message) => {
        var jsonMessage = JSON.stringify(message);
        console.log('Senging message: ' , message);
        socket.emit('message',jsonMessage);
    }


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
    };

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
       
       
        socket.on("roomJoined", (data)=>{
            console.log("roomJoined :: ",data);
        })


        socket.on('message', (data) => {
            var parsedMessage = JSON.parse(data);
            console.info('Received message: ' , data);

                switch (parsedMessage.id) {
                        case 'startCall':
                            console.log("startCall ", parsedMessage);
                            break;
                        case 'registerResponse':
                            this.resgisterResponse(parsedMessage);
                            break;
                         case 'callResponse':
                             this.callResponse(parsedMessage);
                              break;
                          case 'incomingCall':
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
                              console.log(parsedMessage);
                              webRtcPeer.addIceCandidate(parsedMessage);
                              break;
                    default:
                        console.error('Unrecognized message', parsedMessage.message);
            }
        });
        console.log(socket);
        socket.on('chat',(data)=> {
            console.log(data);
        this.recieveChat(data);
        })
    };

    Call = () =>{
        console.log('In call()');
        if (document.getElementById('peer').value === '') {
            window.alert("You must specify the peer name");
            return;
        }

        this.setState({callState: PROCESSING_CALL});
        //console.log("stateofcall"+" "+callState);
        //showSpinner(videoInput, videoOutput);
        var options = {
            localVideo : this.state.videoInput,
            remoteVideo : this.state.videoOutput,
            mediaConstraints: {
                audio: true,
                video: {
                    width: {
                        min: "640",
                        max: "1223"
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
            console.log(tis);
            this.generateOffer(function(error, offerSdp) {
                if (error) {
                    console.error(error);
                    tis.setState({callState: NO_CALL});
                }
                var message = {
                    id : 'call',
                    from : document.getElementById('name').value,
                    to : document.getElementById('peer').value,
                    sdpOffer : offerSdp
                };
                console.log(message);
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

    resgisterResponse(message) {
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
    }

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
        }
        console.log(this.state);
    }

    incomingCall(message) {
        // If bussy just reject without disturbing user
        console.log('inComing call()', this.state.callState);
        //console.log(callState);

        if (this.state.callState != NO_CALL) {
            var response = {
                id : 'incomingCallResponse',
                from : message.from,
                callResponse : 'reject',
                message : 'bussy'

            };
            console.log(1111111114444, response);
            return this.sendMessage(response , "resp.");
        }

        this.setState({callState: PROCESSING_CALL });
        if (window.confirm('User ' , message.from
            , ' is calling you. Do you accept the call?')) {
            //showSpinner(videoInput, videoOutput);

            var options = {
                localVideo : this.state.videoInput,
                remoteVideo : this.state.videoOutput,
                mediaConstraints: {
                    audio: true,
                    video: {
                        width: {
                            min: "640",
                            max: "1223"
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
            webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
                function(error) {
                    if (error) {
                        console.error(error);
                        tis.setState({callState: NO_CALL});
                    }

                    this.generateOffer(function(error, offerSdp) {
                        if (error) {
                            console.error(error);
                            tis.setState({callState: NO_CALL});
                        }
                        var response = {
                            id : 'incomingCallResponse',
                            from : message.from,
                            callResponse : 'accept',
                            sdpOffer : offerSdp
                        };
                        console.log("sending sdpOffer ::", response)
                        tis.sendMessage(response);
                    });
                });

        } else {
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
        console.log(this.state);
    }

    startCommunication(message) {
        this.setState({callState: IN_CALL});
        console.log("startCommunication :: ",message.sdpAnswer );
        webRtcPeer.processAnswer(message.sdpAnswer);
    }

    onIceCandidate(candidate) {
        console.log(candidate);
        console.log('Local candidate' , JSON.stringify(candidate));

        var message = {
            id : 'onIceCandidate',
            candidate : candidate
        }
        console.log(this);
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
        return(
            <div>
                {<input id='name'/>}
                {<button onClick={this.Register.bind(this)} className='btn btn-primary'>Register</button>}
                <hr/>
                <input id='peer'/>
                {<button onClick={this.Call.bind(this)} className='btn btn-danger'>Call</button>}
                {<button onClick={this.stop.bind(this)} className='btn btn-danger'> Stop</button>}
                <hr/>
                <div className="container">
                    <div className="row">
                        <div className="col-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="card-title">Global Chat</div>
                                    <hr/>
                                    <div className="messages" id>
                                       {this.state.message.map(msg => {
                                           console.log(msg)
                                            return (
                                            <div>  { msg } </div>
                                        )
                                    })}
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <br/>
                                    <input type="text" id='message' placeholder="Message" className="form-control"/>
                                    <br/>
                                    <button className="btn btn-primary form-control" onClick={this.sendChat.bind(this)}>Send</button>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-7" style={{ float: "right" }}>
                            <div id="video">
                                <video id="videoOutput" autoPlay width="640px" height="480px" poster="./download (1).png"></video>
                                <video id="videoInput" autoPlay width="240px" height="180px" poster="./download (1).png" ></video>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}