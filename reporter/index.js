"use strict";

const AWS = require("aws-sdk");
const CONFIG = require("./aws.json");
const moment = require("moment");
const _ = require("underscore");
const Handlebars = require("handlebars");
const get = require("./get");

const FORMAT = "YYYY-MM-DD";


// set up database and params for query
let now = moment().date();
let end = moment().date(now - 1);
let start = moment().date(now - 7);
let db = new AWS.DynamoDB.DocumentClient();
let s3 = new AWS.S3();
let ses = new AWS.SES();

const params = {
	TableName: CONFIG.table,
	IndexName: "domain-date-index",
	KeyConditionExpression: "#dm = :dm AND #date BETWEEN :start AND :end",
	ExpressionAttributeNames: {
		"#dm": "domain",
		"#date": "date"
	},
	ExpressionAttributeValues: {
		":dm": "www.hunterhoose.co.uk", // needs to be in the config
		":start": start.format(FORMAT),
		":end": end.format(FORMAT)
	}
};


exports.handler = (event, context, callback) => {
	let templates = {}, data;

	// set complete handler to only execute once all three AWS calls have completed
	let complete = _.after(3, () => {
		let templateParams = {
			viewsByDate    : get.viewsByDate(data.Items),
			viewsByUrl     : get.viewsByURL(data.Items),
			viewsByReferrer: get.viewsByReferrer(data.Items)
		};

		_.each(templates, (v, k) => templates[k] = Handlebars.compile(v));


		let email = {
			Destination: {
				ToAddresses: ["stoo.goff@gmail.com"] // should be in config
			},
			Message: {
				Body: {
					Text: {
						Charset: "UTF-8",
						Data: templates["txt"](templateParams)
					},
					Html: {
						Charset: "UTF-8",
						Data: templates["html"](templateParams)
					}
				},
				Subject: {
					Charset: "UTF-8",
					Data: "Weekly report for www.hunterhoose.co.uk"
				}
			},
			Source: "reports@stoogoff.com"
		};

		ses.sendEmail(email, (err, data) => {
			if(err) {
				console.error(err, err.stack);
			}
			else {
				callback();
			}
		});
	});


	// start all the async queries
	s3.getObject({
		Bucket: CONFIG.templates,
		Key: "template.html" // this needs to have a default setting as well as a website specific setting
	}, (err, response) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			templates["html"] = response.Body.toString();
			complete();
		}
	});

	s3.getObject({
		Bucket: CONFIG.templates,
		Key: "template.txt" // this needs to have a default setting as well as a website specific setting
	}, (err, response) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			templates["txt"] = response.Body.toString();
			complete();
		}
	});

	db.query(params, (err, response) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			data = response;
			complete();
		}
	});
};
