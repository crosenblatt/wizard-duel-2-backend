const MongoClient = require('mongodb').MongoClient; // Framework to communicate with MongoDB Database
const Binary = require('mongodb').Binary; // Framework to store binary data in MongoDB
const fs = require("fs"); // USED FOR TESTING PROFILE PICTURE UPLOAD
const uri = "mongodb+srv://WizardDuel2Server:WkpqH14nTFi9jXwu@wizard-duel-backend-4krit.mongodb.net/test?retryWrites=true"
const client = new MongoClient(uri, { useNewUrlParser: true });

// POSSIBLE ENUM FORMAT FOR TITLES
const TITLE = {
  NONE:   {value: 0, name: "", code: "N/A"},	
  TITLE1: {value: 1, name: "Title1", code: "T1"}, 
  TITLE2: {value: 2, name: "Title2", code: "T2"}, 
  TITLE3: {value: 3, name: "Title3", code: "T3"}
};


// Global variables for MongoDB connection
var connection, db;

/*
 * Summary. Function that connects to database
 *
 * @return {int} Returns a value depending on if server connected to database or not (-1 = Cannot connect to database, 0 = Connected) 
 */
const startDatabaseConnection = async function() {
	try {
		connection = await client.connect();
		db = connection.db('Wizard-Duel-2');
	}catch(err){
		console.log(err.stack);
		return -1;
	}

	return 0;
}

/*
 * Summary. Function that closes database connection
 *
 * @return {int} Returns a value depending on if server disconnected from database or not (-1 = Cannot close connection to database, 0 = Disconnected) 
 */
const closeDatabaseConnection = async function() {
	try {
		connection.close();
	}catch(err){
		console.log(err.stack);
		return -1;
	}
	
	return 0;
}

/*
 * Summary. Function that clears database.
 *
 * @return {int} Returns a value depending on if server disconnected from database or not (-1 = Cannot close connection to database, 0 = Dropped Successfully) 
 */
const clearDatabase = async function() {
	try {
		db.collection('User Accounts').drop();
	}catch(err){
		console.log(err.stack);
		return -1;
	}
	
	return 0;
}

/*
 * Summary. Function that creates a new user account
 *
 * @param {String} usrname  The username of the account being created
 * @param {String} pass 	The HASHED password of the account being created
 * @param {String} mail 	The email of the account being created
 *
 * @return {int} Returns a value depending on if account created or invalid information (-1 = Cannot connect to database, 0 = Valid, 1 = Username already exists, 2 = Account already using the email) 
 */
const createAccount = async function(usrname, pass, mail) {
	
	//Possibly create variable to hold cursor so we can close it after we finish with it.

	const user = {
		"username": usrname,
		"password": pass,
		"online": false,
		"email": mail,
		"title": 0,
		"UnlockedTitles": [0],
		"profilePic": null,
		"level": 1,
		"rank": -1,
		"eloRating": -1,
		"wins": 0,
		"losses": 0,
		"spellbook": [1, 2, 3, 4, 5]
	};

	let userExists, emailExists;
	try {


		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		//emailExists = await db.collection('User Accounts').find({email: mail}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		emailExists = await accountEmailExists(mail);
		if(userExists === -1 || emailExists === -1){return -1;}	

		if (!userExists && !emailExists) {
			await db.collection('User Accounts').insertOne(user);
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (userExists) {return 1;}
	else if (emailExists) {return 2;}
	else {return 0;} 
}


/*
 * Summary. Function that removes a user account from the database
 *
 * @param {String} usrname  The username of the account being rem,oved
 *
 * @return {int} Returns a value depending on if account created or invalid information (-1 = Cannot connect to database, 0 = User Removed, 1 = Username Invalid) 
 */
const deleteAccount = async function(usrname) {
	let userExists;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			await db.collection('User Accounts').deleteOne({username: usrname});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return 0;} 
}


/*
 * Summary. Function that updates an account's hashed password
 *
 * @param {String} usrname 	The username of the account being updated
 * @param {String} pass 	The hashed password that will update the old password of the account
 *
 * @return {int} Returns a value depending on if password updated or invalid information (-1 = Cannot connect to database, 0 = Valid, 1 = Invalid Username) 
 */
const updatePassword = async function(usrname, pass) {
	let userExists;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			await db.collection('User Accounts').updateOne({username: usrname}, {$set: {password: pass}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return 0;} 
}

/*
 * Summary. Function that gets the hashed password of an account
 *
 * @param {String} usrname 	The username of the account which the password is being extracted
 *
 * @return {int} 	Returns a value depending on invalid information (-1 = Cannot connect to database, 1 = Invalid Username) 
 * @return {String} Returns a string of the password
 */
const getAccountPassword = async function(usrname) {
	let userExists, pass;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			pass = await db.collection('User Accounts').findOne({username: usrname}, {projection: {password: true, _id: false}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return pass.password;} 
}

/*
 * Summary. Function that gets an account's stats
 *
 * @param {String} usrname 	The username of the account which the stats are being extracted
 *
 * @return {int} 	Returns a value depending on invalid information (-1 = Cannot connect to database, 1 = Invalid Username)
 * @return {Object} Returns an Object with the account stats
 */
const getAccountStats = async function(usrname) {
	let userExists, stats;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			stats = await db.collection('User Accounts').findOne({username: usrname}, {projection: {level: true, rank: true, eloRating: true, wins: true, losses: true, _id: false}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return stats;} 
}


/*
 * Summary. Function that updates the stats of a user account.
 *
 * @param {String} usrname 	The username of the account which the stats are being updated
 * @param {Object} stats    The updated stats of the user account
 *
 * @return {int} Returns a value depending on invalid information (-1 = Cannot connect to database, 0 = valid, 1 = Invalid Username) 
 */
const updateAccountStats = async function(usrname, stats) {
	let userExists;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			await db.collection('User Accounts').updateOne({username: usrname}, {$set: {level: stats.level, rank: stats.rank, eloRating: stats.eloRating, wins: stats.wins, losses: stats.losses}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return 0;} 
}


/*
 * Summary. Function that gets the username, rank, and ELO of all users in a certain rank range..
 *
 * @param {int} startRank 	The beginning of the range of ranks you want to pull (INCLUSIVE)
 * @param {int} endRank     The end of the range of ranks you want to pull (INCLUSIVE)
 *
 * @return {int}     Returns a value depending on invalid information (-1 = Cannot connect to database)
 * @return {object}  Returns an object that holds an int with the number of users in the rank range and an array of objects for the users with ranks within the designated range 
 */
const getLeaderboardInfo = async function(startRank, endRank) {
   	if (startRank >= endRank) {
  		return -1;
  	}

    let leaderboardInfo = {
    	userCount: 0,
    	userInfo: []
    };

    let temp;
  	try {
      temp = await db.collection('User Accounts').find({rank: {$gte:startRank, $lte: endRank}},{projection: {username: true, rank: true, eloRating: true, _id: false}});
      leaderboardInfo.userCount = await temp.count();
      leaderboardInfo.userInfo = await temp.sort({rank: 1}).toArray();
  	} catch (err) {
		console.log(err.stack);
		return -1;
	}

    return leaderboardInfo;
}

/*
 * Summary. Function that updates if the user is online.
 *
 * @param {String} usrname 	The username of the account which the status is being updated
 * @param {Object} status   The updated status of the user account
 *
 * @return {int} Returns a value depending on invalid information (-1 = Cannot connect to database, 0 = valid, 1 = Invalid Username) 
 */
const updateAccountStatus = async function(usrname, status) {
	let userExists;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			await db.collection('User Accounts').updateOne({username: usrname}, {$set: {online: status}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return 0;} 
}


/*
 * Summary. Function that gets an account's email
 *
 * @param {String} usrname  The username of the account which the email is being extracted
 *
 * @return {int} 	Returns a value depending on invalid information (-1 = Cannot connect to database, 1 = Invalid Username)
 * @return {String} Returns a boolean of user's status
 */
const getAccountStatus = async function(usrname) {
	let userExists, status;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}		

		if (userExists) {
			status = await db.collection('User Accounts').findOne({username: usrname}, {projection: {online: true, _id: false}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return status.online;} 
}


/*
 * Summary. Function that gets an account's email
 *
 * @param {String} usrname  The username of the account which the email is being extracted
 *
 * @return {int} 	Returns a value depending on invalid information (-1 = Cannot connect to database, 1 = Invalid Username)
 * @return {String} Returns a string of the account's email
 */
const getAccountEmail = async function(usrname) {
	let userExists, mail;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}		

		if (userExists) {
			mail = await db.collection('User Accounts').findOne({username: usrname}, {projection: {email: true, _id: false}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return mail.email;} 
}


/*
 * Summary. Function that gets all non-security account information
 *
 * @param {String} usrname  The username of the account which the info is being extracted
 *
 * @return {int} 	Returns a value depending on invalid information (-1 = Cannot connect to database, 1 = Invalid Username)
 * @return {Object} Returns an Object with all non-security user information
 */
const getAccountInfo = async function(usrname) {
	let userExists, profilePicData, info;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}		

		if (userExists) {
			info = await db.collection('User Accounts').findOne({username: usrname}, {projection: {profilePic: true, title: true, UnlockedTitles: true, level: true, rank: true, eloRating: true, wins: true, losses: true, spellbook: true, _id: false}});
			if (info.profilePic != null) {
				profilePicData = info.profilePic.data.buffer;
			} else {
				profilePicData = null;
			}
			info.profilePic = profilePicData;
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return info;} 
}


/*
 * Summary. Function that updates the active title of a user account.
 *
 * @param {String} usrname 		 The username of the account which the stats are being updated
 * @param {ENUM}   active_title  The updated active title of the user account
 *
 * @return {int} Returns a value depending on invalid information (-1 = Cannot connect to database, 0 = valid, 1 = Invalid Username) 
 */
const updateAccountTitle = async function(usrname, active_title) {
	let userExists;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			await db.collection('User Accounts').updateOne({username: usrname}, {$set: {title: active_title}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return 0;} 
}


/*
 * Summary. Function that updates the unlocked title array of a user account.
 *
 * @param {String}      usrname 		 The username of the account which the stats are being updated
 * @param {INT array}   unlocked_titles   The updated active title of the user account
 *
 * @return {int} Returns a value depending on invalid information (-1 = Cannot connect to database, 0 = valid, 1 = Invalid Username) 
 */
const updateAccountUnlockedTitles = async function(usrname, unlocked_titles) {
	let userExists;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			await db.collection('User Accounts').updateOne({username: usrname}, {$set: {UnlockedTitles: unlocked_titles}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return 0;} 
}

/*
 * Summary. Function that updates the current spellbook of a user account.
 *
 * @param {String}      usrname 		 The username of the account which the stats are being updated
 * @param {INT array}   new_spellbook    The updated active title of the user account
 *
 * @return {int} Returns a value depending on invalid information (-1 = Cannot connect to database, 0 = valid, 1 = Invalid Username) 
 */
const updateAccountSpellbook = async function(usrname, new_spellbook) {
	let userExists;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			await db.collection('User Accounts').updateOne({username: usrname}, {$set: {spellbook: new_spellbook}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return 0;} 
}


/*
 * Summary. Function that updates the active profile picture of a user account.
 *
 * @param {String} 		 usrname 	  The username of the account which the profile picture is being updated
 * @param {Binary Data}  pictureData  The Binary Data for the profile picture being updated.
 * @param {String}       fileName     The Name of the picture file. -> INCLUDE FILE EXTENSION -> MIGHT REMOVE LATER BASED ON CLIENT SIDE IMPLEMENTATION
 *
 * @return {int} Returns a value depending on invalid information (-1 = Cannot connect to database, 0 = valid, 1 = Invalid Username) 
 */
const updateAccountProfilePicture = async function(usrname, pictureData, fileName) {
	let userExists;
	let imgData = {};
	try {
		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}	

		if (userExists) {
			imgData.data = Binary(pictureData);
			imgData.name = fileName;
			await db.collection('User Accounts').updateOne({username: usrname}, {$set: {profilePic: imgData}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return 0;} 
}


/*
 * Summary. Function that gets the profile picture for an account
 *
 * @param {String} usrname  The username of the account which the profile picture is being extracted
 *
 * @return {int} 		  Returns a value depending on invalid information (-1 = Cannot connect to database, 1 = Invalid Username)
 * @return {object}       Returns a JSON Object with BSON Object containing a buffer array of the profile pic's binary data and a string containing a file name.
 */
const getAccountProfilePicture = async function(usrname) {
	let userExists, info;
	try {

		//userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);
		userExists = await userAccountExists(usrname);
		if(userExists === -1){return -1;}		

		if (userExists) {
			info = await db.collection('User Accounts').findOne({username: usrname}, {projection: {profilePic: true}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {
		console.log("user does not exist")
		return 1;
	}

	if(info.profilePic == null) {
		console.log("no picture")
		return 2;
	}
	else {return info.profilePic;} 
}


/*
 * Summary. Function that checks if email exists in database
 *
 * @param {String} mail The email of the account which the password is being extracted
 *
 * @return {int} Returns a value depending on if email exists (-1 = Cannot connect to database, 0 = Does not Exist, 1 = Exists) 
 */
const accountEmailExists = async function(mail) {
	let emailExists;

	try {

		emailExists = await db.collection('User Accounts').find({email: mail}).limit(1).count(true);

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	return emailExists;
}

/*
 * Summary. Function that checks if username exists in database
 *
 * @param {String} usrname The email of the account which the password is being extracted
 *
 * @return {int} Returns a value depending on if username exists (-1 = Cannot connect to database, 0 = Does not Exist, 1 = Exists) 
 */
const userAccountExists = async function(usrname) {
	let userExists;

	try {

		userExists = await db.collection('User Accounts').find({username: usrname}).limit(1).count(true);

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	return userExists;
}


/*
 * Summary. Function that uses ELO to re-rank players
 *
 * @return {int} Returns a value depending on if username exists (-1 = Cannot connect to database) 
 */
const reRank = async function() {
	let temp;
  	try {
    	 let index = 1;
		const cursor = await db.collection('User Accounts').find().sort({eloRating: -1});
		while(await cursor.hasNext()) {
  			const doc = await cursor.next();
  			// process doc here
  			db.collection('User Accounts').updateOne({_id: doc._id}, {$set: {rank: index}});
  			index++;
		}
	} catch (err) {
		return -1;
	}
}

// Exports Relevant Function so other components of the server can use
module.exports = {
	startDatabaseConnection:startDatabaseConnection,
	closeDatabaseConnection:closeDatabaseConnection,
	clearDatabase:clearDatabase,
	createAccount: createAccount,
	deleteAccount: deleteAccount,
	getAccountPassword: getAccountPassword,
	updatePassword: updatePassword,
	getLeaderboardInfo: getLeaderboardInfo,
	getAccountStats: getAccountStats,
	updateAccountStats: updateAccountStats,
	getAccountStatus:getAccountStatus,
	updateAccountStatus: updateAccountStatus,
	getAccountEmail: getAccountEmail,
	getAccountInfo: getAccountInfo,
	updateAccountTitle: updateAccountTitle,
	updateAccountUnlockedTitles: updateAccountUnlockedTitles,
	updateAccountSpellbook: updateAccountSpellbook,
	getAccountProfilePicture: getAccountProfilePicture,
	updateAccountProfilePicture: updateAccountProfilePicture,
	accountEmailExists: accountEmailExists,
	userAccountExists: userAccountExists,
	reRank: reRank
};
