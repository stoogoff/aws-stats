
"use strict";

module.exports = {
	noop(input) {
		return input;
	},

	quoted(input) {
		return input.replace(/^"/, "").replace(/"$/, "");
	},

	date(input) {
		input = input.replace(/^\[/, "").replace(/\s\+\d{4}\]$/, "");

		let time = input.split(":");
		let date = time[0].split("/");

		return new Date(Date.UTC(date[2], months[date[1]], date[0], time[1], time[2], time[3]));
	},

	number(input) {
		return parseInt(input, 10);
	}
};

const months = {
	"Jan": 0,
	"Feb": 1,
	"Mar": 2,
	"Apr": 3,
	"May": 4,
	"Jun": 5,
	"Jul": 6,
	"Aug": 7,
	"Sep": 8,
	"Oct": 9,
	"Nov": 10,
	"Dec": 11
}