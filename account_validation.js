const bcrypt = require('bcryptjs'); 						  // Framework for Secure Password Hashing
const account_management = require('./account_management.js'); // Database Management and Communication Functions
const Verifier = require('email-verifier');					  // API to allow email database verification

/*
 * Summary. Function that hashes the password with Bcrypt
 *
 * @param {String} password The password to be hashed
 *
 * @return {String} Returns the hash value of the password
 */
const hashPassword = function(password) {
	let salt = bcrypt.genSaltSync(12);
	let hash = bcrypt.hashSync(password, salt);
	return hash;	
}

/*
 * Summary. Function that compares inputted password to hash
 *
 * @param {String} password The password to be compared to hash
 * @param {Stirng} hash     The hash the password will be compared to
 *
 * @return {boolean} Returns if the password is correct or not
 */
const checkPassword = function(password, hash) {
	return bcrypt.compareSync(password, hash);
}

/*
 * Summary. Function that makes sure username and associated account email are valid
 *
 * @param {String} username 	The username of the account 
 * @param {String} accountEmail The email of the account
 *
 * @return {int} Returns a value depending on if email address valid or invalid information (-1 = Cannot connect to database, 0 = Valid, 1 = Invalid Account) 
 */
const validateUserAccountEmail = async function(username, accountEmail) {
	let valid = await account_management.getAccountEmail(username);

	if (valid === accountEmail) {return 0;}
	else if (!(valid === accountEmail)) {return 1;}
	else {return valid;}
}

/*
 * Summary. Function that checks validity of login credentials
 *
 * @param {String} username  The username of the account
 * @param {String} password  The password of the account (NOT HASHED)
 *
 * @return {int} Returns a value depending on if login credentials are valid (-1 = Cannot connect to database, 0 = Valid, 1 = Invalid Account Info) 
 */
const validateLoginCredentials = async function(username, password) {
	let validUsername = await account_management.userAccountExists(username);
	if (validUsername === -1) {return validUsername;}
	if (validUsername === 0) {return 1;}

	let hash = await account_management.getAccountPassword(username);
	let validPass = checkPassword(password, hash);
	if (validPass === false) {return 1;}

	return 0;

}


/*
 * Summary. Function that checks validity of login credentials
 *
 * @param {String} username  The username of the account
 * @param {String} email  	 The email of the to be created account
 *
 * @return {int} Returns a value depending on if account creation credentials are valid (-1 = Cannot connect to database, 0 = Valid, 1 = Invalid username, 2 = Invalid email) 
 */
const validateCreationCredentials = async function(username, email) {
	let validUsername = await account_management.userAccountExists(username);
	if (validUsername === -1 || validUsername === 1){return validUsername;}

	let realEmail = await verifyUserEmail(email);

	if (realEmail === -1 || realEmail === 0) {return 2;}

	let validEmail = await account_management.accountEmailExists(email)
	if (validEmail === -1) {return validEmail;}
	if (validEmail === 1) {return 2;}

	return 0;
}

/*
 * Summary. Function that verifies if the user submitted email acutally exists with API
 * 
 * @param {String} email The Email to be verified
 *
 * @return {promise} Returns a promise with JSON object after API Call
 */
const verifyEmail = function(email) {
	//API key -> Will expire eventually ~1000 free API Calls
	let verifier = new Verifier("at_uVApvixK8F6x22OzAoITnnniYxxOR");
	var result;

    var promise = new Promise(function(resolve, reject){
		verifier.verify(email, function (err, data) {
			if (err) {reject (err);}
			else {resolve(data);}
		});
    });
    return promise;
}


/*
 * Summary. Function that that interprets returned API Object and determines if email is valid
 * 
 * @param {String} email The Email to be verified
 *
 * @return {int} Returns if email if valid (-1 = API ERROR (NOT a valid EMAIL FORMAT usually), 0 = Does Not Exist, 1 = Exists)
 */
const verifyUserEmail = async function(email) {

	let result, data;
	try{
		data = await verifyEmail(email);
	} catch (err) {
		//console.log(err);
		return -1;
	}

	if(data.formatCheck === 'true' && data.smtpCheck === 'true' && data.dnsCheck === 'true' && data.disposableCheck === 'false') {return 1;}

	return 0;

}


// Exports Relevant Function so other components of the server can use
module.exports = {
	hashPassword: hashPassword,
	checkPassword: checkPassword,
	validateUserAccountEmail: validateUserAccountEmail,
	validateLoginCredentials: validateLoginCredentials,
	validateCreationCredentials: validateCreationCredentials
};

