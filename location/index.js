"use strict";

const AWS = require("aws-sdk");
const CONFIG = require("./aws.json");
const _ = require("underscore");
const location = require("./location");
const convert = require("./convert");


let reader = new AWS.DynamoDB.DocumentClient();
let writer = new AWS.DynamoDB();

let readTableParams = {
	TableName: CONFIG.readTable,
	IndexName: "remote_address-index"
};
let writeTableParams = {
	TableName: CONFIG.writeTable
};


exports.handler = (event, context, callback) => {
	let need, saved;
	let complete = _.after(2, () => {
		let addresses = _.chain(need).difference(saved).first(50).value();

		if(addresses.length === 0) {
			callback();
			return;
		}

		location.bulk(addresses, (err, data) => {
			if(err) {
				console.error(err, err.stacktrace);
			}
			else {
				let toSend = [];

				data.forEach(d => toSend.push(convert(d)));

				// save to db in batches of 25
				while(toSend.length > 0) {
					let chunk = toSend.splice(0, 25);
					let batchParams = {
						RequestItems: {}
					};

					batchParams.RequestItems[CONFIG.writeTable] = chunk;

					writer.batchWriteItem(batchParams, (err, data) => {
						if(err) {
							console.error(err, err.stack);
						}
						else {
							console.log(data);
						}
					});
				}
			}
		});
	});

	reader.scan(readTableParams, (err, data) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			need = _.chain(data.Items).map(i => i.remote_address).unique().value();
			complete();
		}
	});

	reader.scan(writeTableParams, (err, data) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			saved = data.Items.map(i => i.ipaddress);
			complete();
		}
	});
};