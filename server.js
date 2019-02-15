const password_reset = require('./password_reset.js');
const account_validation = require('./account_validation.js');
const account_management = require('./account_management.js');
const Player = require('./player.js').default
const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),

io = require('socket.io').listen(server);
app.get('/', (req, res) => {
res.send('Chat Server is running on port 3000')
});

pqueue = [];
var roomNums = {};

async function server_init() {
	await account_management.startDatabaseConnection();
};

server_init();

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
    });

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
        console.log("room " + room + " contains " + roomNums[room] + " people");
    });


  socket.on('createAccount', async function(username, password, email){
	console.log(username + " " + password + " " + email);
	let result = {"valid": -1};

	result.valid = await account_validation.validateCreationCredentials(username, email);
	console.log(result.valid);
	if (result.valid === 0) {await account_management.createAccount(username,account_validation.hashPassword(password), email);}
	socket.emit('accountCreated', result);
  });

  socket.on('loginAccount', async function(username, password){
	console.log(username + " " + password);
	let result = { 
		"valid": -1,
		"userInfo": NULL
	};

	result.valid = await account_validation.validateLoginCredentials(username, password);

	if(result.valid === 0){
		result.userInfo = await account_management.getAccountInfo(username);
	}
	socket.emit('login', result);
  });

  socket.on('getUserStats', async function(username){
	console.log(username);
	let result = {"valid": -1 };
	result.valid = await account_management.getAccountStats(username);

	socket.emit('statsValid', result);
  });

  socket.on('resetPassword', async function(username, email){
	console.log(username + " " + email);
	let result = {"valid": -1 };
	result.valid = await account_validation.validateUserAccountEmail(username, email);
	
	if(result.valid === 0){
		result.valid = await password_reset.sendPasswordEmail(username, email);
	}
	socket.emit('passwordReset', result);
  });

});


server.listen(3000,()=>{
    console.log('Node app is running on port 3000, hi' );
})

process.on('SIGINT', async function() {
	await account_management.closeDatabaseConnection();
	process.exit(0);
});