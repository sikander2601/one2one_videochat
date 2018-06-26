var path = require('path');
var express = require('express');
var minimist = require('minimist');
var url = require('url');
var kurento = require('kurento-client');
var fs    = require('fs');
var http = require('http');
var socketio = require('socket.io');

//var users = {};

var argv = minimist(process.argv.slice(2), {
  default: {
      as_uri: "http://localhost:8443",
      ws_uri: "http://128.199.175.103:8888/kurento"
  }
});

var options =
{
  key:  fs.readFileSync('keys/server.key'),
  cert: fs.readFileSync('keys/server.crt')
};

var app = express();
//var http = require('http').Server(app);
//var io = require('socket.io')(http);
/*
 * Definition of global variables.
 */

var kurentoClient = null;
var pipelines = {};
var candidatesQueue = {};
var idCounter = 0;
let User = new Users();
let Room = new Rooms();

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

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

// Represents caller and callee sessions


function Rooms() {
    this.roomsById= {};
}

Rooms.prototype.sendMessage = function(message) {
    //this.socket.emit('message',JSON.stringify(message));
    io.to(message.roomId).emit('message',JSON.stringify(message.message))
}


Rooms.prototype.getById = function(roomId) {
    return this.roomsById[roomId];
}


Rooms.prototype.register = function(roomid, room) {
    this.roomsById[roomid] = room;
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
    console.log('sendMessage :: to' + socket.id);
    socket.emit('message',JSON.stringify(message));
    //io.to(message.roomId).emit('message',JSON.stringify(message.message))
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
                    userRegistry.getById(callerId).socket.emit('message',JSON.stringify({
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
                        userRegistry.getById(calleeId).socket.emit('message',JSON.stringify({
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
/*
var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = https.createServer(options, app).listen(port, function() {
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});
*/
/*
var wss = new ws.Server({
    server : server,
    path : '/one2one'
});
*/

io.on('connection', function(socket) {
    //var sessionId = nextUniqueId();

    socket.on('error', function (error) {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    socket.on("joinRoom", function(roomParams){
        console.log('joinRoom :: '+ roomParams);
        let roomId  = roomParams.webinarId;
        socket.join(roomParams.webinarId);
        let roomLength = io.sockets.adapter.rooms[roomId].length
        console.log('roomLength ::' + roomLength );
        if(roomLength <= 2) {
            let userId = roomParams.userId;
            let user = {
                id: userId,
                room: roomId,
            }
            User.register(user);

            //console.log('socket :: ' + socket);
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
                //console.log(temp);
                temp.user2 = { 'id': userId,
                    'socket':  socket }
                Room.sendMessage('message', JSON.stringify({
                    id:"startCall",
                    numberOfMember : roomLength
                }) )
                message = {
                    id: 'roomJoined',
                    message: "user joined the room " + roomId + " length:" + roomLength,
                    roomId: roomId,
                    roomLength: roomLength,
                };
                temp = Room.getById(roomId);
                console.log(temp);
                socket.emit('roomJoined',message);
            }
        }
    });

    socket.on('close', function (data) {
        console.log('Connection ' + data.roomId + ' closed');
        stop(data.roomId);
        //userRegistry.unregister(sessionId);
    });

    socket.on('chat', function(data){
        console.log('chat');
        io.to(data.roomId).emit('chat', data);
    })

    socket.on('message', function (_message) {
        var message = JSON.parse(_message);
        console.log('Connection ' , message.roomId , ' received message ', message);

        switch (message.id) {
            //case 'register':
              //  console.log('now_here');
                //break;

            case 'call':
                let users = Room.getById(message.roomId);
                console.log('Sockets :: ' + users.user1.socket.id, users.user2.socket.id)
                call(message.roomId , users.user1, users.user2, message.sdpOffer);
                break;

            case 'incomingCallResponse':
                incomingCallResponse(message.roomId, message.from, message.to, message.callResponse, message.sdpOffer);
                console.log("message.sdpOffer")
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
                console.log(message);
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
    Room.unregister(roomId)
    User.unregister(user.user1.Id);
    User.unregister(user.user2.Id);

    if (stoppedUser) {
        stoppedUser.peer = null;
        delete pipelines[stoppedUser.id];
        var message = {
            id: 'stopCommunication',
            message: 'remote user hanged out'
        }
        stoppedUser.sendMessage(message)
    }

    clearCandidatesQueue(roomId);
}

function incomingCallResponse(roomId ,callerId, calleeId, callResponse, calleeSdp) {
    console.log("incoming call :: ", roomId, from, callResponse, calleeSdp);
    clearCandidatesQueue(roomId);

    function onError(callerReason, calleeReason) {
        console.log("onError :: " , callerReason, calleeReason);
        if (pipeline) pipeline.release();
        if (caller) {
            var callerMessage = {
                id: 'callResponse',
                response: 'rejected'
            }
            if (callerReason) callerMessage.message = callerReason;
            caller.sendMessage(callerMessage);
        }

        var calleeMessage = {
            id: 'stopCommunication'
        };
        if (calleeReason) calleeMessage.message = calleeReason;
        callee.sendMessage(calleeMessage);
    }

    var callee = calleeId;
    if (!from || !user.getById(from)) {
        return onError(null, 'unknown from = ' + from);
    }
    var caller = callerId;

    if (callResponse === 'accept') {
        var pipeline = new CallMediaPipeline();
        pipelines[caller] = pipeline;
        pipelines[callee] = pipeline;

        pipeline.createPipeline(caller, callee, function(error) {
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
                    //callee.sendMessage(message);
                    callee.socket.emit(message.id, message);
                    message = {
                        id: 'callResponse',
                        response : 'accepted',
                        sdpAnswer: callerSdpAnswer
                    };
                    caller.socket.emit(message.id, message);
                    //caller.sendMessage(message);
                });
            });
        });
    } else {
        var decline = {
            id: 'callResponse',
            response: 'rejected',
            message: 'user declined'
        };
        caller.socket.emit(decline.id, decline);
    }
}

function call(roomId, to, from, sdpOffer) {
    clearCandidatesQueue(roomId);
    console.log("Here")
    //var caller = userRegistry.getById(callerId);
    //var rejectCause = 'User ' + to + ' is not registered';
    if (Room.getById(roomId)) {
        caller = from;
        callee = to;
        caller.sdpOffer = sdpOffer
        callee.peer = caller;
        caller.peer = callee;
        var message = {
            id: 'incomingCall',
            roomId: roomId,
            from: from,
            to: to,
        };
        try{
            console.log('calling :: incoming call ', to.socket.id , message);
            return User.sendMessage(message, to.socket);
        } catch(exception) {
            rejectCause = "Error " + exception;
        }

    }
    else {
        var message = {
            id: 'callResponse',
            response: 'rejected: ',
            message: rejectCause
        };
        console.log("from :: " + from.socket.id);
        User.sendMessage(message, from.socket);
    }
}
/*
function register(id, socket, callback) {
    socket.emit('create',socket.id);
    function onError(error) {
        socket.emit('message',JSON.stringify({id:'registerResponse', response : 'rejected ', message: error}));
    }

    userRegistry.register(new UserSession(id, socket));
    try {
        console.log((JSON.stringify({id: 'registerResponse', response: 'accepted'})));
        socket.emit('message',JSON.stringify({id: 'registerResponse', response: 'accepted'}));
    } catch(exception) {
        onError(exception);
    }
}
*/
function clearCandidatesQueue(userId) {
    if (candidatesQueue[userId]) {
        delete candidatesQueue[userId];
    }
}

function onIceCandidate(userId, _candidate) {
    console.log("onIceCandidate :: Candidate :" + _candidate );
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);
    var user = User.getById(userId);

    if (pipelines[userId] && pipelines[userId].webRtcEndpoint && pipelines[userId].webRtcEndpoint[userId]) {
        var webRtcEndpoint = pipelines[userId].webRtcEndpoint[userId];
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
