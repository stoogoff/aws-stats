"use strict";

const AWS = require("aws-sdk");
const logger = require("./logger");
const convert = require("./convert");
const CONFIG = require("./aws.json");

let s3 = new AWS.S3();
let db = new AWS.DynamoDB();

exports.handler = (event) => {
	let bucket = event.Records[0].s3.bucket.name;
	let key    = event.Records[0].s3.object.key;

	s3.getObject({
		Bucket: bucket,
		Key: key
	}, (err, data) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			let logs = logger.parse(data.Body);
			let toSend = [];

			logs = logs.filter(i => i.action.startsWith("WEBSITE."));

			if(CONFIG.extensions && Array.isArray(CONFIG.extensions)) {
				logs = logs.filter(i => CONFIG.extensions.indexOf(i.path.substring(i.path.lastIndexOf("."))) != -1);
			}

			logs.forEach(l => toSend.push(convert(l)));

			let params = {
				RequestItems: {}
			};

			params.RequestItems[CONFIG.table] = toSend;

			db.batchWriteItem(params, (err, data) => {
				if(err) {
					console.error(err, err.stack);
				}
				else {
					console.log(data);
				}
			});
		}
	});
};
