"use strict";

module.exports = function convert(input) {
	let output = {
		"_id": {
			S: input.request_id
		}
	};

	let fields = ["domain", "remote_address", "action", "path", "http_request", "http_status_code", "referrer", "user_agent"];

	fields.forEach(i => output[i] = { S: input[i] });

	let date = input["date"];
	let month = pad(date.getMonth() + 1);
	let day = pad(date.getDate());

	output["date"] = { S: `${date.getFullYear()}-${month}-${day}` };

	return {
		PutRequest: {
			Item: output
		}
	};
}

function pad(num) {
	return num < 10 ? `0${num}` : num;
}