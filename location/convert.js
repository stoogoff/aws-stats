"use strict";

module.exports = function convert(input) {
	let output = {
		"ipaddress": {
			S: input.ip
		}
	};

	let fields = ["city", "region", "country", "country_name"];

	fields.forEach(i => {
		if(input[i]) {
			output[i] = { S: input[i] };
		}
	});

	let date = new Date();
	let month = pad(date.getMonth() + 1);
	let day = pad(date.getDate());

	output["updated"] = { S: `${date.getFullYear()}-${month}-${day}` };

	return {
		PutRequest: {
			Item: output
		}
	};
}

function pad(num) {
	return num < 10 ? `0${num}` : num;
}
