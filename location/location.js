"use strict";

const https = require("https");
const noop = (err, data) => {};


const LOCATION = {
	get: (address, callback) => {
		if(!callback) {
			callback = noop;
		}

		const options = {
			hostname: "ipapi.co",
			port: 443,
			path: `/${address}/json`,
			method: "GET"
		};

		let req = https.request(options, (res) => {
			let content = "";

			res.on("data", data => {
				content += data;
			});

			res.on("end", () => {
				let json = null, err = null;

				try {
					json = JSON.parse(content);
				}
				catch (e) {
					err = e;
				}

				callback(err, json)
			});
		});

		req.on("error", (err) => callback(err, null));
		req.end();
	},

	bulk: (addresses, callback) => {
		if(!callback) {
			callback = noop;
		}

		// force uniqueness
		addresses = addresses.filter((i, x, a) => a.indexOf(i) == x);

		let response = [];
		let wrappedCallback = (err, data) => {
			if(err) {
				callback(err, null);
				return;
			}

			response.push(data);
			
			if(addresses.length == 0) {
				callback(null, response);
			}
			else {
				setTimeout(() => LOCATION.get(addresses.shift(), wrappedCallback), 250);
			}
		};

		LOCATION.get(addresses.shift(), wrappedCallback);
	}
};

module.exports = LOCATION;
