// TO TEST -> GO TO ROOT SERVER DIRECTORY AND RUN 'npm test'

const account_management = require('../account_management.js');
const account_validation = require('../account_validation.js');
const password_reset = require('../password_reset.js');
const Player = require('../player.js');
const Room = require('../room.js');

const crypto = require('crypto'); 	
const assert = require('assert');

describe("Backend Tests", function() {

	// Starts Connection with the Database before running tests-> ALWAYS MOVE THIS TO THE TOP LEVEL DESCRIBE OR TESTING WILL BREAK
	before(async () => {
		await account_management.startDatabaseConnection();
		await account_management.clearDatabase();
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

			it("should return login credentials invalid (User already online).", async () => {
				let username, password, hash, email, result;
				username = generateTestString();
				password = generateTestString();
				hash = account_validation.hashPassword(password);
				email = generateTestString();

				try{
					await account_management.createAccount(username, hash, email);
					await account_management.updateAccountStatus(username, true);
					result = await account_validation.validateLoginCredentials(username, password);
					await account_management.deleteAccount(username);
				} catch(err){
					throw(err);
				}
				assert(result === 2);
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
				newEmail = 'wizardduel2@gmail.com'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

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
				newEmail = 'wizardduel2@gmail.com'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

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
				email = 'wizardduel2@gmail.com'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

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
				email = 'wizardduel2@gmail.com'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

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
				newEmail = 'wizardduel2@gmail.com'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

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
			this.timeout(10000);

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
			this.timeout(10000);

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

        describe("#getLeaderboardInfo()", function () {
        	//Takes a second to communicate with the database
			this.slow(10000);
			this.timeout(10000);

			it("should return usernames for all the generated users within rank range (1-10).", async () => {
				// Creating test users to add to the database.
  				for(let i = 0; i < 10; i++) {
  					let string = "test" + i;
  					let stats = {
  						level: i, 
  						rank: i + 1, 
  						eloRating: i + 2, 
  						wins: i + 1, 
  						losses: i
  					};
    				await account_management.createAccount(string, string, string);
    				await account_management.updateAccountStats(string, stats);
   				}	

   				let result = await account_management.getLeaderboardInfo(1, 10);
   				let success = 0;
   				for(let i = 0; i < 10; i++) {
  					let string = "test" + i;
   					if (result.userInfo[i].username === string && result.userInfo[i].rank === (i+1)) {
   						success = 1;
   					} else {
   					    success = 0;
   					}
   					await account_management.deleteAccount(string);
   				}

   				assert(success === 1 && result.userCount === 10);
			});

			it("should only return the generated users within the tested range (1-25).", async () => {
				// Creating test users to add to the database.
				let count = 0;
				let randomUsers = [];
  				for(let i = 0; i < 25; i++) {
  					let randRank = Math.floor(Math.random() * (25)) + 1;
  					let string = "test" + randRank;
  					if(!randomUsers.includes(randRank)) {
  						randomUsers[count] = randRank;
  						count++;
  					}

  					let stats = {
  						level: i, 
  						rank: randRank, 
  						eloRating: i + 2, 
  						wins: i + 1, 
  						losses: i
  					};
    				await account_management.createAccount(string, string, string);
    				await account_management.updateAccountStats(string, stats);
   				}	

   				randomUsers.sort(function(a, b){return a - b});

   				let result = await account_management.getLeaderboardInfo(1, 25);
   				let success = 0;
   				for(let i = 0; i < count; i++) {
  					let string = "test" + randomUsers[i];
   					if (result.userInfo[i].username === string && result.userInfo[i].rank === (randomUsers[i])) {
   						success = 1;
   					} else {
   					    success = 0;
   					}
   					await account_management.deleteAccount(string);
   				}

   				assert(success === 1 && result.userCount === count);
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
			this.timeout(10000);

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
				email = 'wizardduel2@gmail.com'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

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
				newEmail = 'wizardduel2@gmail.com'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

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
				newEmail = 'wizardduel2@gmail.com'; //CHANGE THIS TO A TESTING EMAIL IF YOU WANT

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

    // Player Class Tests
	describe("player_class", function(){
			
		describe('buildPlayer', function () {

					it("should generate random names properly", () => {
						var p = new Player();
						var p2 = new Player();
						assert(true);
					});
			
					it("should construct correct new player objects with correct name", () => {
						var name = "player1";
						var p = new Player(name, 0)
						assert(p.name == name);
					});
					it("should construct correct new player objects with correct elo", () => {
						var name = "player1";
						var elo = 67;
						var p = new Player(name, elo)
						assert(p.elo = elo);
					});
					it("should construct players to valid defauly parameters", () => {
						var p = new Player("abc", 123);
						assert(p.health == 100 && p.mana == 100 && p.room == '-1');
					});
					it("should generate proper and valid random names for rooms", () => {
						var r = new Room();
						assert(r.name.length > 1);
					});
					it("should not generate the same room name twice", () => {
						var r1 = new Room();
						var r2 = new Room();
						assert(r1.name != r2.name);
					});
					it("should defaultly set rooms to be empty", () => {
						var room = new Room();
						assert(room.size == 0 && room.players.length == 0);
					});
					it("should properly add players to rooms with addPlayer()", () => {
						var r = new Room();
						var p = new Player("testplayer", 10);
						r.addPlayer(p);
						assert(r.size == 1 && r.players.pop() == p);
					});
					it("should properly clear out rooms", () => {
						var r = new Room();
						r.addPlayer(new Player("test1", 12));
						r.addPlayer(new Player("test2", 20));
						r.clearRoom()
						assert(r.size == 0 && r.players.length == 0);
					});
					it("should return the proper size with getSize()", () => {
						var r = new Room();
						var p = new Player("testplayer", 10);
						r.addPlayer(p);
						assert(r.getSize() == 1);
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
