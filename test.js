const pr = require('./password_reset.js');


async function test(username, accountEmail)
{
	let out = await pr.sendPasswordEmail(username, accountEmail);
	console.log(out);
}

test("vikas", "tatineni.vikas@gmail.com");