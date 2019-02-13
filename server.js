const Player = require('./player.js').default
const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),
io = require('socket.io').listen(server);
app.get('/', (req, res) => {

res.send('Chat Server is running on port 3000')
});

<<<<<<< HEAD
pqueue = [];
=======
var roomNums = {};
>>>>>>> 22034a9bfb1a4ce2917306b1d719132d8a9ad9cb

io.on('connection', (socket) => {

    console.log('user connected');

    /*
    Enqueue: Adds player to list of queued players 
    */
    socket.on('enqueue', (player) => {
        let name = Player.generateName();
        let score = Player.getRandomInt(0, 100000)
        var p = new Player(name, score)


        pqueue.push(p);
    
    });


    /*
    Join: Enters a user into a room, which is an instance of a game
    There should be at most two users per room at any time
    */

    socket.on('join', function(room) {

        /*
        If there are already two people in the room, the server rejects the request
        to join
        */
        var numInRoom = 0;
        if (roomNums[room] == null) {
            roomNums[room] = 1;
        } else {
            numInRoom = roomNums[room];
            if(numInRoom == 2) {
                console.log("rejected");
                return;
            }
            roomNums[room] ++;
        }

        console.log("room " + room + " contains " + roomNums[room] + " people")
        console.log("accepted");
        socket.join(room);
        console.log("user has joined room: " + room);
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
        roomNums[room] --;
    })

})

server.listen(3000,()=>{
    console.log('Node app is running on port 3000, hi' );
})
