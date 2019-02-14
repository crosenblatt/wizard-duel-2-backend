// TO TEST -> GO TO ROOT SERVER DIRECTORY AND RUN 'npm test'

const account_management = require('../account_management.js');
const account_validation = require('../account_validation.js');
const password_reset = require('../password_reset.js');

const crypto = require('crypto'); 	
const assert = require('assert');

describe("Backend Tests", function() {

	// Starts Connection with the Database before running tests-> ALWAYS MOVE THIS TO THE TOP LEVEL DESCRIBE OR TESTING WILL BREAK
	before(async () => {
		await account_management.startDatabaseConnection();
	});

	// Closes Connection with the Database after running tests -> ALWAYS MOVE THIS TO THE TOP LEVEL DESCRIBE OR TESTING WILL BREAK
	after(async () => {
		await account_management.closeDatabaseConnection();
	});


	// Account Validation Tests
	describe("account_validation", function() {
		describe("#hashPassword()", function() { 

			//Reseting Time to be a little slower since salting and hashing takes a second
			this.slow(2000);

			it("should return a hash of the password input", (done) => {
				let hash, originalString;
				originalString = generateTestString();
				hash = account_validation.hashPassword(originalString);
				assert.equal((hash === originalString) , (hash === undefined));
				done();
			});
		});

		describe("#checkPassword()", function() {
			//Reseting Time to be a little slower since salting and hashing takes a second
			this.slow(2000);

			it("should return that password does not match the hash.", function() {
				let hash, originalString;
				originalString = generateTestString();
				hash = account_validation.hashPassword(originalString);
				originalString = generateTestString();
				assert(!(account_validation.checkPassword(originalString, hash)));
			});

			it("should return that password matches the hash.", function() {
				let hash, originalString;
				originalString = generateTestString();
				hash = account_validation.hashPassword(originalString);
				assert(account_validation.checkPassword(originalString, hash));
			});
		});

		describe('#validateLoginCredentials', function() {

			// Takes a second to communicate with the database
			this.slow(3000);
			it("should return login credentials invalid (Invalid Username).", async () => {
				let username, password, hash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateLoginCredentials(generateTestString(), password);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return login credentials invalid (Invalid Password).", async () => {
				let username, password, hash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateLoginCredentials(username, generateTestString());
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});
	
			it("should return login credentials valid.", async () => {
				let username, password, hash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateLoginCredentials(username, password);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 0);
			});
		});

		describe('#validateCreationCredentials', function() {
			//Takes a second to communicate with the database
			this.slow(3000);
			//Email verification API is super slow. May need to change later. Increased Timeout to compensate.
			this.timeout(10000);

			it("should return creation credentials valid.", async () => {
				let username, password, hash, email, newEmail, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();
				newEmail = 'vtatinen@purdue.edu'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateCreationCredentials(generateTestString(), newEmail);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 0);
			});

			it("should return creation credentials invalid (Invalid Username).", async () => {
				let username, password, hash, email, newEmail, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();
				newEmail = 'vtatinen@purdue.edu'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateCreationCredentials(username, newEmail);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return creation credentials invalid (Invalid Email -> Already Taken).", async () => {
				let username, password, hash, email, newEmail, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = 'vtatinen@purdue.edu'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateCreationCredentials(generateTestString(), email);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 2);
			});

			it("should return creation credentials invalid (Invalid Email -> Email Does Not Exist).", async () => {
				let username, password, hash, email, newEmail, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();
				newEmail = generateTestString() + '@' + generateTestString() + '.' + generateTestString(); //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateCreationCredentials(generateTestString(), newEmail);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}

				assert(result === 2);
			});
		});

		describe('#validateUserAccountEmail', function () {
			this.slow(3000);

			it("should return email credentials valid.", async () => {
				let username, password, hash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = 'vtatinen@purdue.edu'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateUserAccountEmail(username, email);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 0);
			});

			it("should return email credentials invalid (Account Not Associated With Email).", async () => {
				let username, password, hash, email, newEmail, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();
				newEmail = 'vtatinen@purdue.edu'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_validation.validateUserAccountEmail(username, newEmail);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});
		});

	});

	// Database Account Management Tests
	describe("account_management", function(){
		describe("#createAccount()", function() {
			
			//Takes a second to communicate with the database
			this.slow(3000);

			it("should return that account was successfully created.", async () => {
				let username, password, hash, email, userCheck, passwordCheck, emailCheck;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				try{
					result = await account_management.createAccount(username, hash, email);

					//Checks if original created user is unchanged
					userCheck = await account_management.userAccountExists(username);
					passwordCheck = (account_validation.checkPassword(password, await account_management.getAccountPassword(username))) ? 1 : 0;
					emailCheck = (email === await account_management.getAccountEmail(username)) ? 1 : 0; 

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 0 && userCheck === 1 && passwordCheck === 1 && emailCheck === 1);
			});


			it("should return that account was not created (Invalid Username).", async () => {
				let username, password, hash, email, result, userCheck, passwordCheck, emailCheck;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_management.createAccount(username, account_validation.hashPassword(generateTestString()), generateTestString());

					//Checks if original created user is unchanged
					userCheck = await account_management.userAccountExists(username);
					passwordCheck = (account_validation.checkPassword(password, await account_management.getAccountPassword(username))) ? 1 : 0;
					emailCheck = (email === await account_management.getAccountEmail(username)) ? 1 : 0; 

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1 && userCheck === 1 && passwordCheck === 1 && emailCheck === 1);
			});

			it("should return that account was not created (Invalid Email).", async () => {
				let username, password, hash, email, result, userCheck, passwordCheck, emailCheck;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_management.createAccount(generateTestString(), account_validation.hashPassword(generateTestString()), email);

					//Checks if original created user is unchanged
					userCheck = await account_management.userAccountExists(username);
					passwordCheck = (account_validation.checkPassword(password, await account_management.getAccountPassword(username))) ? 1 : 0;
					emailCheck = (email === await account_management.getAccountEmail(username)) ? 1 : 0; 

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 2 && userCheck === 1 && passwordCheck === 1 && emailCheck === 1);
			});
		});

		describe("#updatePassword()", function() {
			
			//Reseting Time to be a little slower since salting and hashing takes a second
			this.slow(3000);

			it("should return that password was successfully changed.", async () => {
				let username, password, hash, newPassword, newHash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				newPassword = generateTestString();
				newHash = account_validation.hashPassword(newPassword);
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					await account_management.updatePassword(username, newHash);
					result = (account_validation.checkPassword(newPassword, await account_management.getAccountPassword(username))) ? 1 : 0;
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return that password was not changed (Invalid Username).", async () => {
				let username, password, hash, newUsername, email, result, passwordCheck;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				newUsername = generateTestString();
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					result = await account_management.updatePassword(newUsername, account_validation.hashPassword(generateTestString()));

					//Checks if password unchanged
					passwordCheck = (account_validation.checkPassword(password, await account_management.getAccountPassword(username))) ? 1 : 0;

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1 && passwordCheck === 1);
			});
		});

		describe("#getAccountStats()", function () {
			//Takes a second to communicate with the database
			this.slow(3000);
			it("should return ELO correctly.", async () => {
				let username, password, hash, email, stats, dbStats, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				stats = {
					level: Math.floor(Math.random() * 101),
					rank: Math.floor(Math.random() * 101),
					eloRating: Math.floor(Math.random() * 101),
					wins: Math.floor(Math.random() * 101),
					losses: Math.floor(Math.random() * 101)
				};

				try{
					await account_management.createAccount(username, hash, email)
					await account_management.updateAccountStats(username, stats);
					dbStats = await account_management.getAccountStats(username);
					result = (dbStats.eloRating === stats.eloRating) ? 1 :  0;

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return rank correctly.", async () => {
				let username, password, hash, email, stats, dbStats, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				stats = {
					level: Math.floor(Math.random() * 101),
					rank: Math.floor(Math.random() * 101),
					eloRating: Math.floor(Math.random() * 101),
					wins: Math.floor(Math.random() * 101),
					losses: Math.floor(Math.random() * 101)
				};

				try{
					await account_management.createAccount(username, hash, email)
					await account_management.updateAccountStats(username, stats);
					dbStats = await account_management.getAccountStats(username);
					result = (dbStats.rank === stats.rank) ? 1 :  0;

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return level correctly.", async () => {
				let username, password, hash, email, stats, dbStats, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				stats = {
					level: Math.floor(Math.random() * 101),
					rank: Math.floor(Math.random() * 101),
					eloRating: Math.floor(Math.random() * 101),
					wins: Math.floor(Math.random() * 101),
					losses: Math.floor(Math.random() * 101)
				};

				try{
					await account_management.createAccount(username, hash, email)
					await account_management.updateAccountStats(username, stats);
					dbStats = await account_management.getAccountStats(username);
					result = (dbStats.level === stats.level) ? 1 :  0;

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return wins correctly.", async () => {
				let username, password, hash, email, stats, dbStats, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				stats = {
					level: Math.floor(Math.random() * 101),
					rank: Math.floor(Math.random() * 101),
					eloRating: Math.floor(Math.random() * 101),
					wins: Math.floor(Math.random() * 101),
					losses: Math.floor(Math.random() * 101)
				};

				try{
					await account_management.createAccount(username, hash, email)
					await account_management.updateAccountStats(username, stats);
					dbStats = await account_management.getAccountStats(username);
					result = (dbStats.wins === stats.wins) ? 1 :  0;

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return losses correctly.", async () => {
				let username, password, hash, email, stats, dbStats, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				stats = {
					level: Math.floor(Math.random() * 101),
					rank: Math.floor(Math.random() * 101),
					eloRating: Math.floor(Math.random() * 101),
					wins: Math.floor(Math.random() * 101),
					losses: Math.floor(Math.random() * 101)
				};

				try{
					await account_management.createAccount(username, hash, email)
					await account_management.updateAccountStats(username, stats);
					dbStats = await account_management.getAccountStats(username);
					result = (dbStats.losses === stats.losses) ? 1 :  0;

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return account credentials invalid (Invalid Username).", async () => {
				let username, password, hash, email, stats, dbStats, statsResult, userResult;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				stats = {
					level: Math.floor(Math.random() * 101),
					rank: Math.floor(Math.random() * 101),
					eloRating: Math.floor(Math.random() * 101),
					wins: Math.floor(Math.random() * 101),
					losses: Math.floor(Math.random() * 101)
				};

				try{
					await account_management.createAccount(username, hash, email)
					userResult = await account_management.updateAccountStats(generateTestString(), stats);
					dbStats = await account_management.getAccountStats(username);
					statsResult = (dbStats.losses === stats.losses) ? 1 :  0;

					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(statsResult === 0 && userResult === 1);
			});

		});

	});

	// Password Reset System Tests -> MAKE SURE TO HAVE TRANSPORTER CORRECTLY SET IN 'password_reset.js'
	describe("password_reset", function(){
		
		describe("#generateTempPassword()", function (){
			// JUST CHECKS IF 100 STRINGS ARE MATCHING -> Probably should implement chi square testing
			it("should return that all randomly generated passwords are unique.", function (){
				let hash = {};
				for(let i = 0; i < 100; i++) {
					if(hash[password_reset.generateTempPassword()] === true){
						assert(false);
						break;
					} else {
						hash[password_reset.generateTempPassword()] = true;
					}
				}
				assert(true);
			});
		});

		describe("#updateAccountInfo()", function (){
			// Takes a second to connect to the database
			this.slow(3000);

			it("should return that password was successfully changed.", async () => {
				let username, password, hash, newPassword, email, updateSuccess, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				newPassword = password_reset.generateTempPassword();
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					updateSuccess = await password_reset.updateAccountInfo(username, newPassword);
					result = (account_validation.checkPassword(newPassword, await account_management.getAccountPassword(username))) ? 1 : 0;
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1 && updateSuccess === 0);
			});
		});

		describe('#sendPasswordEmail()', function () {
		    // Takes a second to connect to the database and send an email
			this.slow(10000);

			it("should return that password email was sent successfully.", async () => {
				let username, password, hash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = 'vtatinen@purdue.edu'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await password_reset.sendPasswordEmail(username, email);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}

				assert(result === 0);
			});

			it("should return that password email was not sent successfully (Invalid Username).", async () => {
				let username, password, hash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				newEmail = 'vtatinen@purdue.edu'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await password_reset.sendPasswordEmail(generateTestString(), email);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});

			it("should return that password email was not sent successfully (Invalid Email).", async () => {
				let username, password, hash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				newEmail = 'vtatinen@purdue.edu'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

				try{
					await account_management.createAccount(username, hash, email);
					result = await password_reset.sendPasswordEmail(username, generateTestString());
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 1);
			});
		});
	}); 
});

/*
 * Summary. Function that generates temporary strings for the tests
 *
 * @return {String} Returns a String
 */
function generateTestString() {
	let string = '';
	const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()+_-=}{[]|:;"/?.><,`~';
	const poolLength = pool.length;

	// Generates a random number
	const randomNumber = function(max) {
		// gives a number between 0 (inclusive) and max (exclusive)
		let rand = crypto.randomBytes(1)[0];
		while (rand >= 256 - (256 % max)) {
			rand = crypto.randomBytes(1)[0];
		}
		return rand % max;
	};

	for (let i = 0; i < 15; i++) {
		string += pool[randomNumber(poolLength)];
	}

	return string;
}