const password_reset = require('./password_reset.js');
const account_validation = require('./account_validation.js');
const account_management = require('./account_management.js');
const Room = require('./room.js')
const Player = require('./player.js')
const fs = require("fs");
//const Queue = require('./queue.js').default
var waitUntil = require('wait-until')
const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),
//Comment
io = require('socket.io').listen(server);
app.get('/', (req, res) => {
res.send('Server is running on port 3000')
});

async function server_init() {
	await account_management.startDatabaseConnection();
};

//Comment
server_init();

var rooms = [];
// Create 10 empty rooms for now
for(var i = 0; i < 10; i++){
    rooms.push(new Room());
    //rooms[i].addPlayer(new Player("test" + i, (i * 50) + 100))
}

function verifyRooms() {
    rooms.forEach(function(room) {
        if( room.size < 2) {
            return;
        }
    })
    //make new rooms bc all are full
    for( var i = 0; i < 5; i++) {
        rooms.push(new Room());
    }
}

io.on('connection', (socket) => {

    console.log('user connected');

    /*
    Enqueue: Adds player to list of queued players 
    */
    socket.on('enqueue', (name, score, level, spellbook, title) => {
        // Generate random info for now

        var p = new Player(name, score, level, spellbook, title)
        console.log(name + " enqueued")

        // Find first open room and place player in it
        var found = false;

        //check if all rooms are full
        verifyRooms();
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
                    return;
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


    socket.on('join', function(room, name, health, mana, spells, level, skillScore, title) {

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
                        "level": level,
                        "elo": skillScore,
                        "title": title 
                    }

        rooms.forEach(function(r) {
            if(r.size == 2 && r.name == room) {
                var user = {
                    "name" : r.players[0].name,
                    "health" : r.players[0].health,
                    "mana" : r.players[0].mana,
                    "spells" : r.players[0].spellbook,
                    "level": r.players[0].level,
                    "elo": r.players[0].elo,
                    "title": r.players[0].title 
                }

                console.log("getting existing user: " + r.players[0].spellbook)
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


  socket.on('createAccount', async function(username, password, email){
	//console.log(username + " " + password + " " + email);
	let result = {"valid": -1}; // -1 - Can't Connect to Database, 0 = valid, 1 = invalid username, 2 = invalid email

	result.valid = await account_validation.validateCreationCredentials(username, email);
	console.log(result.valid);
	if (result.valid === 0) {await account_management.createAccount(username,account_validation.hashPassword(password), email);}
	socket.emit('accountCreated', result);
  });

  
  socket.on('loginAccount', async function(username, password){
	console.log(username + " " + password);
	let result = { 
		"valid": -1,
		"userInfo": {}
	};
    result.valid = await account_validation.validateLoginCredentials(username, password);
    console.log(result.valid);
    if(result.valid === 0) {
    	await account_management.updateAccountStatus(username, true);
    	let info = await account_management.getAccountInfo(username);
    	//console.log(test);
    	result.userInfo = info;
    }
	socket.emit('login', result);
  });

  socket.on('getUserStats', async function(username){
	console.log(username);
	let result = {
		"valid": -1,
		"userStats": {}
    };

	let stats = await account_management.getAccountStats(username);
	if(stats === -1 || stats === 1) {
		result.valid = stats;
	} else {
		result.valid = 0;
		result.userStats = stats;
	}
		
	socket.emit('statsValid', result);
  });


  /* Gets the account info of the given username -> USED TO DISPLAY OTHER USER'S INFO TO CLIENT*/
  socket.on('getUserInfo', async function(username){
  	let result = {
  		"valid": -1,
  		"userInfo": {}
  	};
  	let info = await account_management.getAccountInfo(username);
  	if(info === -1 || info === 1) {
  		result.valid = info;
  	} else {
  		result.valid = 0;
  		result.userInfo = info;
  	}
  	socket.emit('userInfo', result);
  });

  /* Updates active user title for the database */
  socket.on('updateActiveTitle', async function (username, titleNum){
  	//console.log(username + " " + titleNum);
  	let result;
  	result = await account_management.updateAccountTitle(username, titleNum);
	//socket.emit('updateTitle', result);
	return;
  });

  /* Updates a user's unlocked titles in the database -> JUST FOR TESTING. SHOULD BE IMPLEMENTED AFTER usER FINISHES A MATCH */
  /* NEED JSON ARRAY PASSED IN */
  socket.on('updateUnlockedTitles', async function (username, unlockedArray){
  	console.log(username + " " + unlockedArray);
  	let result;
  	result = await account_management.updateAccountUnlockedTitles(username, unlockedArray);
  	///socket.emit('updateUnlockedTitles', result);
  	return;
  });

  socket.on('updateCurrentSpellbook', async function (username, spellbook){
    console.log(username + " " + spellbook);
    let result;
    result = await account_management.updateAccountSpellbook(username, spellbook);
    return;
  });

  socket.on('getLeaderboardInfo', async function(startRank, endRank){
  	let leaderboardInfo = {
  		"valid": -1,
    	"userCount": 0,
    	"userInfo": []
   	};
  
    let info = await account_management.getLeaderboardInfo(startRank, endRank);

    if(info === -1) {
    	leaderboardInfo.valid = info;
    } else {
    	leaderboardInfo.valid = 0;
    	leaderboardInfo.userCount = info.userCount;
    	leaderboardInfo.userInfo = info.userInfo;
    }

    socket.emit('leaderboardValid', leaderboardInfo);
  });

  /*
  Retrieve a player's profile picture
  */
  socket.on('getProfilePic', async function(name) {
      let pic = await account_management.getAccountProfilePicture(name)
      if(pic != -1 && pic != 1 && pic != 2) {
        let buffer = pic.data.buffer
        console.log(buffer)
        let retVal = {
          "pic": buffer
        }
        //fs.writeFileSync("./picture.png", buffer)
        socket.emit('profilePic', retVal)
      }
      console.log(pic)
      
  });

  socket.on('updateProfilePic', async function(name, pic, file) {
    console.log("updating profile pic...");
    //console.log(pic);
    //var byteObj = JSON.parse(pic);
    console.log(pic);
    //fs.writeFileSync("./test.png", pic)
    let ret = await account_management.updateAccountProfilePicture(name, pic, file);
    if(ret != 0) {
        console.log("picture update error: " + ret);
    } else {
        console.log("picture update success");
    }
    console.log("updated");
    return;
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

  socket.on('gameover', async function(username, elo, level, loss){
  	console.log("game ended");

  	let stats = await account_management.getAccountStats(username);
  	stats.eloRating = elo;
  	stats.level = level;
  	
  	if(loss === true) {
  		stats.losses = stats.losses + 1;
  	} else {
  		stats.wins = stats.wins + 1;
  	}

  	//TODO: RECALCULATE RANK METHOD -> SORT DATABASE BASED ON NEW ELO
  	await account_management.updateAccountStats(username, stats);
  	await account_management.reRank();
  	stats = await account_management.getAccountStats(username);

  	let result = {
  		"rank": stats.rank
  	}
  	socket.emit('updatedStats', result);
  });


  /*
  remove a user from a room
  called when a game ends
  */
  socket.on('leave', function(room) {
    console.log("game over, leaving room" + room);
    socket.leave(room);
    var index = 0;
    rooms.forEach(function(r) {
        if(r.name == room) {
            rooms.splice(index, 1);
        }
        index++;
    })
  });

  /*disconnect: Self explanatory, used when a user exits a room */
  socket.on('disconnect', function() {
    console.log("disconnecting from server"); 
  });

});

process.on('SIGINT', async function() {
	await account_management.closeDatabaseConnection();
	process.exit(0);
});

server.listen(3000,()=>{
    console.log('Node app is running on port 3000, hi' );
});
