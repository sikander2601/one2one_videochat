let http = require('http');
let socketio = require('socket.io');


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
                socket: socket,
            }
            User.register(user);
            message = {
                id: 'roomJoined',
                message: "user joined the room " + roomId + " length:" + roomLength,
                roomId: roomId,
                roomLength: roomLength,
            };
            //console.log('socket :: ' + socket);
            if (roomLength === 1) {
                var room_entity = {
                    user1: { 'id': userId,
                        'socket':  socket },
                    user2: null,
                };

                Room.register(roomId, room_entity);
                socket.emit('roomJoined',message);
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
                //console.log('Sockets :: ' + users.user1.socket.id, users.user2.socket.id)
                var from = null;
                var to = null;
                if( users.user1.id === message.userId){
                    from = users.user1;
                    to = users.user2;
                }
                else{
                    from = users.user2;
                    to = users.user1;
                }
                call(message.roomId , from, to, message.sdpOffer);
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
                console.log(message);
                break;
        }

    });
});
