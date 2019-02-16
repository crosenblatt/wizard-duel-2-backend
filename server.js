const Room = require('./room.js')
const Player = require('./player.js')
//const Queue = require('./queue.js').default
const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),
io = require('socket.io').listen(server);
app.get('/', (req, res) => {

res.send('Chat Server is running on port 3000')
});

var roomNums = {};
var rooms = [];
// Create 10 empty rooms for now
for(var i = 0; i < 10; i++){
    rooms.push(new Room());
}

io.on('connection', (socket) => {

    console.log('user connected');

    /*
    Enqueue: Adds player to list of queued players 
    */
    socket.on('enqueue', (player) => {
        // Generate random info for now
        let name = Player.generateName();
        let score = Player.getRandomInt(0, 100000)
        var p = new Player(name, score)
        
        // Find first open room and place player in it
        do {
            for(var r in rooms){
                if(r.getSize() < 2){
                    p.room = r.name;
                    r.addPlayer(p);
                    break;
                }
            }
        } while(p.room == "-1");

        // Wait until another player gets placed in the room
        while(p.room.getSize() < 2){}

        // emit back player object with room code attached
        socket.emit(JSON.stringify(p));
    
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
                socket.emit("rejected");
                return;
            }
            roomNums[room] ++;
        }

        console.log("room " + room + " contains " + roomNums[room] + " people")
        console.log("accepted");
        socket.join(room);
        console.log("user has joined room: " + room);

        //console.log("rooms: " + Object.values(socket.rooms));
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

    /*
    remove a user from a room
    called when a game ends
    */
    socket.on('leave', function(room) {
        console.log("game over, leaving room");
        socket.leave(room);
        roomNums[room] --;
        console.log("room " + room + " contains " + roomNums[room] + " people");
    })

    /*disconnect: Self explanatory, used when a user exits a room */
    socket.on('disconnect', function() {
        
        console.log("disconnecting from server"); 
    })

})

server.listen(3000,()=>{
    console.log('Node app is running on port 3000, hi' );
})