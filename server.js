const Room = require('./room.js')
const Player = require('./player.js')
//const Queue = require('./queue.js').default
var waitUntil = require('wait-until')
const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),
io = require('socket.io').listen(server);
app.get('/', (req, res) => {

res.send('Chat Server is running on port 3000')
});

var rooms = [];
// Create 10 empty rooms for now
for(var i = 0; i < 10; i++){
    rooms.push(new Room());
    //rooms[i].addPlayer(new Player("test" + i, (i * 50) + 100))
}

io.on('connection', (socket) => {

    console.log('user connected');

    /*
    Enqueue: Adds player to list of queued players 
    */
    socket.on('enqueue', (name, score) => {
        // Generate random info for now
        var p = new Player(name, score)
        console.log(name + " ennqueued")
        
        // Find first open room and place player in it
        var found = false;

        // First check for rooms w/ 1 player and match by ELO up to certain threshold
        eloRange = 5;
        while(eloRange < 50 && !found){

            rooms.forEach(function(room) {
                if(room.size == 1){
                    if(Math.abs(score - room.players[0].elo) < eloRange){
                        found = true;
                        p.room = room.name;
                        room.addPlayer()
                        //break;
                    }
                }
            })

            if(!found){
                console.log(name + " searching...");
                eloRange += 5;
                continue;
            }
            else{
                console.log(name + " found room " + p.room);
                var room = { "room" : p.room };
                    socket.emit("room", room); 
                    break;
            }
        } //endwhile
            




        // If no rooms w/ players found just enter first available room. 
        while(!found){   
        rooms.forEach(function(room) {
                if(room.size < 2 && !found) {
                    p.room = room.name;
                    room.addPlayer(p);
                    found = true;
                }
            })
            console.log(name + " searching...");
        } 
        
        console.log(name + " found: room " + p.room)
        var room = { 
                     "room" : p.room,
                    };

        console.log(room)
        socket.emit("room", room); 
    
    });


    /*
    Join: Enters a user into a room, which is an instance of a game
    There should be at most two users per room at any time
    */

    socket.on('join', function(room, name, health, mana, spells) {

        /*
        If there are already two people in the room, the server rejects the request
        to join
        */
        console.log("accepted");
        socket.join(room);
        console.log("user has joined room: " + room);
        
        var newuser = {
                        "name" : name,
                        "health" : health,
                        "mana" : mana,
                        "spells" : spells,
                    }

        rooms.forEach(function(r) {
            if(r.size == 2 && r.name == room) {
                var user = {
                    "name" : r.players[0].name,
                    "health" : r.players[0].health,
                    "mana" : r.players[0].mana,
                    "spells" : r.players[0].spells
                }
                
                console.log("getting existing user: " + r.players[0].name)
                socket.emit("getuser", user)
                return;
            }
        })
        socket.broadcast.to(room).emit("newuserjoined", newuser)
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
    })

    /*disconnect: Self explanatory, used when a user exits a room */
    socket.on('disconnect', function() {
        console.log("disconnecting from server"); 
    })

})

server.listen(3000,()=>{
    console.log('Node app is running on port 3000, hi' );
})