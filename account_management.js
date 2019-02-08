const MongoClient = require('mongodb').MongoClient; // Framework to communicate with MongoDB Database

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
		username: usrname,
		password: pass,
		email: mail,
		title: TITLE.NONE,
		level: 1,
		rank: -1,
		eloRating: -1,
		spellbook: [-1 , -1 , -1 , -1 ,-1]
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
			stats = await db.collection('User Accounts').findOne({username: usrname}, {projection: {level: true, rank: true, eloRating: true, _id: false}});
		}

	} catch (err) {
		console.log(err.stack);
		return -1;
	}

	if (!userExists) {return 1;}
	else {return stats;} 
}

/*
 * Summary. Function that gets an account's email
 *
 * @param {String} username  The username of the account which the email is being extracted
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

// Exports Relevant Function so other components of the server can use
module.exports = {
	startDatabaseConnection:startDatabaseConnection,
	closeDatabaseConnection:closeDatabaseConnection,
	createAccount: createAccount,
	getAccountPassword: getAccountPassword,
	updatePassword: updatePassword,
	getAccountStats: getAccountStats,
	getAccountEmail: getAccountEmail,
	accountEmailExists: accountEmailExists,
	userAccountExists: userAccountExists
};