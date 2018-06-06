"use strict";

const AWS = require("aws-sdk");
const CONFIG = require("./aws.json");
const moment = require("moment");
const _ = require("underscore");
const Handlebars = require("handlebars");
const get = require("./get");

const FORMAT = "YYYY-MM-DD";


// set up database and params for query
let end = moment().subtract(1, "days");
let start = moment().subtract(7, "days");
let db = new AWS.DynamoDB.DocumentClient();
let s3 = new AWS.S3();
let ses = new AWS.SES();


exports.handler = (event, context, callback) => {
	console.log(event);
	const domain = event.domain;
	const emailTo = event.emailTo;

	let callback2 = _.after(2, callback);

	let templates = {}, data, addresses = {};
	const logParams = {
		TableName: CONFIG.logTable,
		IndexName: "domain-date-index",
		KeyConditionExpression: "#dm = :dm AND #date BETWEEN :start AND :end",
		ExpressionAttributeNames: {
			"#dm": "domain",
			"#date": "date"
		},
		ExpressionAttributeValues: {
			":dm": domain,
			":start": start.format(FORMAT),
			":end": end.format(FORMAT)
		}
	};
	const addressParams = {
		TableName: CONFIG.addressTable
	};

	// set complete handler to only execute once all AWS calls have completed
	let complete = _.after(4, () => {
		let templateParams = {
			total          : _.filter(data, i => !i.http_status_code.startsWith("4")).length,
			viewsByDate    : get.viewsByDate(data),
			viewsByUrl     : get.viewsByURL(data),
			viewsByReferrer: get.viewsByReferrer(data),
			viewsByCountry : get.viewsByCountry(data, addresses),
			viewsByRegion  : _.first(get.viewsByRegion(data, addresses), 10),
			viewsByCity    : _.first(get.viewsByCity(data, addresses), 10)
		};

		_.each(templates, (v, k) => templates[k] = Handlebars.compile(v));

		let html = templates["html"](templateParams);
		let email = {
			Destination: {
				ToAddresses: emailTo
			},
			Message: {
				Body: {
					Text: {
						Charset: "UTF-8",
						Data: templates["txt"](templateParams)
					},
					Html: {
						Charset: "UTF-8",
						Data: html
					}
				},
				Subject: {
					Charset: "UTF-8",
					Data: `Weekly report for ${domain}`
				}
			},
			Source: CONFIG.emailFrom
		};

		s3.putObject({
			Bucket: CONFIG.templates,
			Key: `${domain}/${moment().format(FORMAT)}.html`,
			Body: html
		}, (err, data) => {
			if(err) {
				console.error(err, err.stack);
			}
			else {
				callback2();
			}
		});

		ses.sendEmail(email, (err, data) => {
			if(err) {
				console.error(err, err.stack);
			}
			else {
				callback2();
			}
		});
	});


	// start all the async queries
	s3.getObject({
		Bucket: CONFIG.templates,
		Key: "template.html"
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
		Key: "template.txt"
	}, (err, response) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			templates["txt"] = response.Body.toString();
			complete();
		}
	});

	db.query(logParams, (err, response) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			data = _.chain(response.Items).groupBy(i => `${i.remote_address}+${i.date}+${i.path}+${i.http_status_code}+${i.user_agent}`).map((v, k) => v[0]).value();
			complete();
		}
	});

	db.scan(addressParams, (err, data) => {
		if(err) {
			console.error(err, err.stack);
		}
		else {
			_.each(data.Items, i => addresses[i.ipaddress] = i);
			complete();
		}
	})
};
