let path = require('path');
let express = require('express');
let minimist = require('minimist');
let url = require('url');
let kurento = require('kurento-client');
let http = require('http');
let socketio = require('socket.io');

let argv = minimist(process.argv.slice(2), {
  default: {
      as_uri: "http://localhost:8443",
      ws_uri: "http://128.199.175.103:8888/kurento"
  }
});

let app = express();

var kurentoClient = null;
var pipelines = {};
var candidatesQueue = {};
let User = new Users();
let Room = new Rooms();

var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = http.createServer(app);
var io = socketio(server);

server.listen(port, function() {
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser',port);
});

/*
 * Definition of helper classes
 */

function Rooms() {
    this.roomsById= {};
}

Rooms.prototype.sendMessage = function(message) {
    io.to(message.roomId).emit('message',JSON.stringify(message))
}

Rooms.prototype.getById = function(roomId) {
    return this.roomsById[roomId];
}

Rooms.prototype.register = function(roomId, room) {
    this.roomsById[roomId] = room;
}

Rooms.prototype.unregister = function(id) {
    let room = this.getById(id);
    if (room) delete this.roomsById[id]
}

function Users() {
    this.usersById = {};
}

Users.prototype.register = function(user) {
    this.usersById[user.id] = user;
}

Users.prototype.unregister = function(id) {
    var user = this.getById(id);
    if (user) delete this.usersById[id]
}

Users.prototype.getById = function(id) {
    return this.usersById[id];
}

Users.prototype.sendMessage = function(message, socket) {
    socket.emit('message',JSON.stringify(message));
}


// Represents a B2B active call
function CallMediaPipeline() {
    this.pipeline = null;
    this.webRtcEndpoint = {};
}

CallMediaPipeline.prototype.createPipeline = function(callerId, calleeId, socket, callback) {
    var self = this;
    getKurentoClient(function(error, kurentoClient) {
        if (error) {
            return callback(error);
        }

        kurentoClient.create('MediaPipeline', function(error, pipeline) {
            if (error) {
                return callback(error);
            }

            pipeline.create('WebRtcEndpoint', function(error, callerWebRtcEndpoint) {
                if (error) {
                    pipeline.release();
                    return callback(error);
                }

                if (candidatesQueue[callerId]) {
                    while(candidatesQueue[callerId].length) {
                        var candidate = candidatesQueue[callerId].shift();
                        callerWebRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                callerWebRtcEndpoint.on('OnIceCandidate', function(event) {
                    var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    var caller = User.getById(callerId);
                    caller.socket.emit('message',JSON.stringify({
                        id : 'iceCandidate',
                        candidate : candidate
                    }));
                });

                pipeline.create('WebRtcEndpoint', function(error, calleeWebRtcEndpoint) {
                    if (error) {
                        pipeline.release();
                        return callback(error);
                    }

                    if (candidatesQueue[calleeId]) {
                        while(candidatesQueue[calleeId].length) {
                            var candidate = candidatesQueue[calleeId].shift();
                            calleeWebRtcEndpoint.addIceCandidate(candidate);
                        }
                    }

                    calleeWebRtcEndpoint.on('OnIceCandidate', function(event) {
                        var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                        var callee = User.getById(calleeId);
                        callee.socket.emit('message',JSON.stringify({
                            id : 'iceCandidate',
                            candidate : candidate
                        }));
                    });

                    callerWebRtcEndpoint.connect(calleeWebRtcEndpoint, function(error) {
                        if (error) {
                            pipeline.release();
                            return callback(error);
                        }

                        calleeWebRtcEndpoint.connect(callerWebRtcEndpoint, function(error) {
                            if (error) {
                                pipeline.release();
                                return callback(error);
                            }
                        });
                        self.pipeline = pipeline;
                        self.webRtcEndpoint[callerId] = callerWebRtcEndpoint;
                        self.webRtcEndpoint[calleeId] = calleeWebRtcEndpoint;
                        callback(null);
                    });
                });
            });
        });
    })
}

CallMediaPipeline.prototype.generateSdpAnswer = function(id, sdpOffer, callback) {
    this.webRtcEndpoint[id].processOffer(sdpOffer, callback);
    this.webRtcEndpoint[id].gatherCandidates(function(error) {
        if (error) {
            return callback(error);
        }
    });
}

CallMediaPipeline.prototype.release = function() {
    if (this.pipeline) this.pipeline.release();
    this.pipeline = null;
}

/*
 * Server startup
 */

io.on('connection', function(socket) {
    socket.on('error', function (error) {
        console.log('Connection ' + sessionId + ' error'+ error);
        stop(roomId);
    });

    socket.on("joinRoom", function(roomParams){
        let roomId  = roomParams.webinarId;
        socket.join(roomParams.webinarId);
        let roomLength = io.sockets.adapter.rooms[roomId].length;

        if(roomLength <= 2) {
            let userId = roomParams.userId;
            let user = {
                id: userId,
                room: roomId,
                socket: socket,
            }
            User.register(user);

            message = {
                id: 'roomJoined',
                message: "user joined the room " + roomId + " length:" + roomLength,
                roomId: roomId,
                roomLength: roomLength,
            };

            if (roomLength === 1) {
                var room_entity = {
                    user1: { 'id': userId,
                        'socket':  socket },
                    user2: null,
                };

                Room.register(roomId, room_entity);
            }
            else if (roomLength === 2){
                var temp = Room.getById(roomId);
                temp.user2 = { 'id': userId,
                    'socket':  socket };
                message = {
                    id:"roomJoined",
                    roomLength: roomLength,
                    roomId: roomId,
                };
                User.sendMessage(message, socket);
            }
        }
    });

    socket.on('close', function (data) {
        stop(data.roomId);
    });

    socket.on('chat', function(data){
        io.to(data.roomId).emit('chat', data);
    })

    socket.on('message', function (_message) {
        var message = JSON.parse(_message);
        console.log('Connection ' , message.roomId , ' received message ', message);

        switch (message.id) {

            case 'call':
                let users = Room.getById(message.roomId);
                if( users.user1.id === message.userId){
                     var from = users.user1;
                     var to = users.user2;
                 }
                 else{
                    from = users.user2;
                    to = users.user1;
                }
                call(message.roomId, from, to, message.sdpOffer);
                break;

            case 'incomingCallResponse':
                incomingCallResponse(message.roomId, message.from, message.to, message.callResponse, message.sdpOffer);
                break;

            case 'stop':
                stop(message.roomId);
                break;

            case 'onIceCandidate':
                onIceCandidate(message.userId, message.candidate);
                break;

            default:
                socket.emit('message',JSON.stringify({
                    id: 'error',
                    message: 'Invalid message ' + message
                }));
                break;
        }

    });
});


// Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    kurento(argv.ws_uri, function(error, _kurentoClient) {
        if (error) {
            var message = 'Coult not find media server at address ' + argv.ws_uri;
            return callback(message + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}


function stop(roomId) {
    if (!pipelines[roomId]) {
        return;
    }

    var pipeline = pipelines[roomId];
    delete pipelines[roomId];
    pipeline.release();


    let user = Room.getById(roomId);
    Room.unregister(roomId);
    User.unregister(user.user1.Id);
    User.unregister(user.user2.Id);
}


function incomingCallResponse(roomId ,callerId, calleeId, callResponse, calleeSdp) {
    clearCandidatesQueue(calleeId);

    function onError(callerReason, calleeReason) {
        if (pipeline) pipeline.release();
        if (caller) {
            var callerMessage = {
                id: 'callResponse',
                response: 'rejected'
            }
            if (callerReason) callerMessage.message = callerReason;
            User.sendMessage(callerMessage, caller.socket);
        }

        var calleeMessage = {
            id: 'stopCommunication'
        };
        if (calleeReason) calleeMessage.message = calleeReason;
        User.sendMessage(calleeMessage, callee.socket);
    }

    var callee = User.getById(calleeId);
    var from = callerId;
    if (!User.getById(from)) {
        return onError(null, 'unknown from = ' + from);
    }

    var caller = User.getById(callerId);
    if (callResponse === 'accept') {

        var pipeline = new CallMediaPipeline();

        pipelines[caller.id] = pipeline;
        pipelines[callee.id] = pipeline;

        pipeline.createPipeline(caller.id, callee.id, caller.socket, function(error) {
            if (error) {
                return onError(error, error);
            }
            pipeline.generateSdpAnswer(caller.id, caller.sdpOffer, function(error, callerSdpAnswer) {
                if (error) {
                    return onError(error, error);
                }
                pipeline.generateSdpAnswer(callee.id, calleeSdp, function(error, calleeSdpAnswer) {
                    if (error) {
                        return onError(error, error);
                    }

                    var message = {
                        id: 'startCommunication',
                        sdpAnswer: calleeSdpAnswer,
                        callee : "callee"
                    };
                    User.sendMessage(message, callee.socket);

                    message = {
                        id: 'callResponse',
                        response : 'accepted',
                        sdpAnswer: callerSdpAnswer
                    };
                    User.sendMessage(message, caller.socket);
                });
            });
        });
    } else {
        var decline = {
            id: 'callResponse',
            response: 'rejected',
            message: 'user declined'
        };
        User.sendMessage(decline, caller.socket);
    }
}

function call(roomId, from, to, sdpOffer) {
    clearCandidatesQueue(from.id);

    if (User.getById(to.id)) {
        var caller = from.id;
        var callee = to.id;
        from["sdpOffer"] = sdpOffer;
        User.getById(from.id).sdpOffer= sdpOffer;
        to.peer = caller;
        from.peer = callee;

        var msg = {
            id: 'incomingCall',
            roomId: roomId,
            from: caller,
        };

        try{
            return User.sendMessage(msg, to.socket);
        }
        catch(exception) {
            rejectCause = "Error " + exception;
        }

    }
    else {
        var message = {
            id: 'callResponse',
            response: 'rejected: ',
            message: rejectCause
        };
        User.sendMessage(message, from.socket);
    }
}

function clearCandidatesQueue(userId) {
    if (candidatesQueue[userId]) {
        delete candidatesQueue[userId];
    }
}

function onIceCandidate(userId, _candidate) {
    let candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (pipelines[userId] && pipelines[userId].webRtcEndpoint && pipelines[userId].webRtcEndpoint[userId]) {
        let webRtcEndpoint = pipelines[userId].webRtcEndpoint[userId];
        webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        if (!candidatesQueue[userId]) {
            candidatesQueue[userId] = [];
        }
        candidatesQueue[userId].push(candidate);
    }

}

app.use(express.static(path.join(__dirname, 'static')));
