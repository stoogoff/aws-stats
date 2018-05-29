
"use strict";

const format = require("./format");

const LOGGER = {
	parser: /([^\s]+) ([^\s]+) (\[[^\]]+\]) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+) ("[^"]+") (\d+) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+) ("[^"]+") ([^\s]+)/,
	fields: {
		"owner": format.noop,
		"domain": format.noop, // this is actually bucket
		"date": format.date,
		"remote_address": format.noop,
		"requester": format.noop,
		"request_id": format.noop, // this appears to be unique
		"action": format.noop,
		"path": format.noop,
		"http_request": format.quoted,
		"http_status_code": format.noop,
		"error_code": format.noop,
		"bytes_Sent": format.noop,
		"object_size": format.noop,
		"total_time": format.number,
		"processing_time": format.number,
		"referrer": format.quoted,
		"user_agent": format.quoted,
		"version_id": format.noop
	},

	parse: (input) => {
		let logs = [];

		input.toString().split("\n").forEach(l => {
			if(l) {
				let log = LOGGER.parseLine(l);

				if(log) {
					logs.push(log);
				}
			}
		});

		return logs;
	},

	parseLine: (input) => {
		let matched = input.match(LOGGER.parser);
		let log = {};

		if(!matched) {
			return null;
		}

		Object.keys(LOGGER.fields).forEach((f, i) => log[f] = LOGGER.fields[f](matched[i + 1]));

		return log;
	}
};

module.exports = LOGGER;
