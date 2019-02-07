const nodemailer = require('nodemailer'); // Framework used to send mail to user
const crypto = require('crypto'); // Node.js Cryptography Library


/*
 * Summary. Function that generates temporary password for the user
 *
 * @return {String} Returns a String representing the user's new temporary password
 */
function generateTempPassword() {
	let password = '';
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
		password += pool[randomNumber(poolLength)];
	}

	return password;
}


/*
 * Summary. Function that makes sure username and associated account email are valid.
 *
 * @param {String} username 	The username of the account having its password reset
 * @param {String} accountEmail The email of the user who is reseting password
 *
 * @return Returns a value depending on if email sent or invalid information (0 = Valid, 1 = Invalid Username, 2 = Invalid Email) 
 */
async function validateAccount(username, accountEmail) {
	// TODO: Implement this with the database
	return 0;
}


/*
 * Summary. Function that updates the user's account password in the database with temporary password
 *
 * @param {String} Username 	The username of the user whose password is being reset
 * @param {String} tempPassword The temporary password of the user whose password is being reset
 *
 */
async function updateAccountInfo(username, tempPassword) {
	// TODO: Implement this with the database
}



/*
 * Summary. Function that sends user an email to with new temporary password
 * 
 * @param {String} username 	The username of the account having its password reset
 * @param {String} accountEmail The email of the user who is reseting password
 *
 * @return {int} Returns a value depending on if email sent or invalid information (0 = Valid, 1 = Invalid Username, 2 = Invalid Email)
 */
const sendPasswordEmail = async function(username, accountEmail) {

	// Checks if the user inputed valid data. If not valid, returns error value.
	let checkAccount = await validateAccount(username, accountEmail);
	if (checkAccount != 0) {return checkAccount;} 

	let tempPassword = generateTempPassword(); // Gets temporary Password

	let accountUpdate = await updateAccountInfo(username, tempPassword); // Updates account info in the database with new temporary password

	// Transporter that sends the email from a mail server
	let transporter = nodemailer.createTransport({
		service: 'outlook', // Don't want to make our own mail server, so using another mail service
		auth: {
			user: '', /* INSERT EMAIL HERE */
			pass: '' /* INSERT EMAIL PASSWORD HERE */
		}
	});

	// Object that holds email content
	let mailOptions = {
		from: '', /* INSERT EMAIL HERE */
		to: accountEmail,
		subject: 'Wizard Duel 2 - Password Reset',
		text: 'Your Temporary Password is ' + tempPassword + '.'
	};

	// Function that sends mail from Wizard Duel 2 Support to the user
	transporter.sendMail(mailOptions, function(error, info){
		// Output for internal manual testing to see if email was sent
		if (error) {
			console.log(error);
			throw error;
		} else {
			console.log('Email send: ' + info.response);
		}
	});
	return 0;
}

// Exports Relevant Function so main part of the server can use.
module.exports = {
	sendPasswordEmail: sendPasswordEmail
};