const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),
io = require('socket.io').listen(server);
app.get('/', (req, res) => {

res.send('Chat Server is running on port 3000')
});

io.on('connection', (socket) => {

    console.log('user connected');

    /*
    Join: Enters a user into a room, which is an instance of a game
    There should be two users per room at any time
    */

    socket.on('join', function(room) {
        socket.join(room);
        console.log("user has joined room: " + room);
        //socket.broadcast.emit('userjoinedthechat');
    })

    /*
    messagedetection: Used to detect a spell has been cast
    It detects the spell, then sends it back to all the other clients in the room
    */
    socket.on('messagedetection', (spellName, room) => {

        console.log(spellName);
        let  message = { "spell" : spellName };
        
        console.log(room + ": " + spellName);

        socket.broadcast.to(room).emit('message', message );

        });

    /*disconnect: Self explanatory, used when a user exits a room */
    socket.on('disconnect', function(room) {
        console.log("goodbye");
        //socket.broadcast.to(room).emit( "userdisconnect" ,' user has left');
    })

})

server.listen(3000,()=>{
    console.log('Node app is running on port 3000, hi');
})

