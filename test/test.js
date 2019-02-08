// TO TEST -> GO TO ROOT SERVER DIRECTORY AND RUN 'npm test'

const account_management = require('../account_management.js');
const account_validation = require('../account_validation.js');

const crypto = require('crypto'); 	
const assert = require('assert');

describe("account_validation", function() {

	// Starts Connection with the Database before running tests-> ALWAYS MOVE THIS TO THE TOP LEVEL DESCRIBE OR TESTING WILL BREAK
	before(async () => {
		await account_management.startDatabaseConnection();
	});

	// Closes Connection with the Database after running tests -> ALWAYS MOVE THIS TO THE TOP LEVEL DESCRIBE OR TESTING WILL BREAK
	after(async () => {
		await account_management.closeDatabaseConnection();
	});

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

		it("should return that password does not match the hash.", (done) => {
			let hash, originalString;
			originalString = generateTestString();
			hash = account_validation.hashPassword(originalString);
			originalString = generateTestString();
			assert(!(account_validation.checkPassword(originalString, hash)));
			done();
		});

		it("should return that password matches the hash.", (done) => {
			let hash, originalString;
			originalString = generateTestString();
			hash = account_validation.hashPassword(originalString);
			assert(account_validation.checkPassword(originalString, hash));
			done();
		});
	});

	describe('#validateLoginCredentials', function() {
		// Takes a second to communicate with the server
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