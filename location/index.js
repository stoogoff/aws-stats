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
		let addresses = _.difference(need, saved);
		
		console.log(`Have ${addresses.length} ip addresses to process.`);
	
		addresses = _.first(addresses, CONFIG.maxProcess);
	
		if(addresses.length === 0) {
			callback();
			return;
		}
	
		let sender = function() {
			location.bulk(addresses.splice(0, 25), (err, data) => {
				if(err) {
					console.error(err, err.stacktrace);
				}
				else {
					let toSend = [];
	
					data.forEach(d => toSend.push(convert(d)));
	
					let batchParams = {
						RequestItems: {}
					};
	
					batchParams.RequestItems[CONFIG.writeTable] = toSend;
					
					console.log(`Preparing to save ${toSend.length} ip addresses.`);
	
					writer.batchWriteItem(batchParams, (err, data) => {
						if(err) {
							console.error(err, err.stack);
						}
						else {
							console.log(data);
							sender();
						}
					});
				}
			});
		};
	
		sender();
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