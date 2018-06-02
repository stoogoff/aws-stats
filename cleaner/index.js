"use strict";

const AWS = require("aws-sdk");
const CONFIG = require("./aws.json");
const moment = require("moment");

let reader = new AWS.DynamoDB.DocumentClient();
let writer = new AWS.DynamoDB();

exports.handler = (event, context, callback) => {
	let from = moment().subtract(CONFIG.age, "days").format("YYYY-MM-DD");
	let objects;

	console.log(`Fetching data from ${from}.`);

	let readParams = {
		TableName: CONFIG.table,
		IndexName: "date-index",
		KeyConditionExpression: "#date = :date",
		ExpressionAttributeNames: {
			"#date": "date"
		},
		ExpressionAttributeValues: {
			":date": from
		}
	};

	let deleter = function(data) {
		if(data.length == 0) {
			callback();
			return;
		}

		let writeParams = {
			RequestItems: {}
		};

		let toDelete = [];

		data.forEach(i => {
			toDelete.push({
				DeleteRequest: {
					Key: {
						"_id": {
							S: i._id
						}
					}
				}
			});
		});

		writeParams.RequestItems[CONFIG.table] = toDelete;

		writer.batchWriteItem(writeParams, (err, data) => {
			if(err) {
				console.error(err, err.stack);
			}
			else {
				deleter(objects.splice(0, 25));
			}
		});
	};

	reader.query(readParams, (err, data) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			console.log(`Got ${data.Items.length} items for deletion.`);

			objects = data.Items;
			deleter(objects.splice(0, 25));
		}
	});
};