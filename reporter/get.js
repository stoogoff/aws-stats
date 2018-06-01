"use strict";

const _ = require("underscore");
const moment = require("moment");

const FORMAT = "DD/MM/YYYY";

const unknown = {
	city: "Unknown",
	country: "Unknown",
	country_name: "Unknown",
	region: "Unknown"
};

const reduce = (memo, current) => {
	let o = current[0];

	o.count = current.length;

	memo.push(o);

	return memo;
};

module.exports = {
	// total views by date
	viewsByDate(data) {
		return _.chain(data).filter(i => !i.http_status_code.startsWith("4")).map(i => i.date).reduce((memo, current) => {
			if(!memo[current]) {
				memo[current] = 0;
			}

			memo[current]++;

			return memo;
		}, {}).map((val, key) => {
			return {
				date: moment(key).format(FORMAT),
				count: val
			};
		}).sortBy("date").value();
	},

	// total views to a given URL in the time period
	viewsByURL(data) {
		return _.chain(data).filter(i => !i.http_status_code.startsWith("4")).map(i => {
			return {
				url: `${i.domain}/${i.path}`,
				count: 0
			}
		}).groupBy(i => i.url).reduce(reduce, []).sortBy("count").reverse().value();
	},

	viewsByReferrer(data) {
		return _.chain(data).filter(i => !i.http_status_code.startsWith("4")).map(i => {
			let referrer = i.referrer;

			if(referrer.startsWith("http")) {
				referrer = referrer.replace(/http[s]?:\/\//, "");
				referrer = referrer.substring(0, referrer.indexOf("/"));

				let parts = referrer.split(".");

				if(parts.length > 2) {
					parts.shift();
				}

				referrer = parts.join(".");
			}

			if(referrer == "" || referrer == "-") {
				referrer = "Direct Access";
			}

			return {
				referrer: referrer,
				count: 0
			};
		}).groupBy(i => i.referrer).reduce(reduce, []).sortBy("count").reverse().value();
	},

	viewsByCountry(data, addresses) {
		return _.chain(data).filter(i => !i.http_status_code.startsWith("4")).map(i => addresses[i.remote_address] || unknown).map(i => {
			return {
				country: i.country_name,
				count: 0
			}
		}).groupBy(i => i.country).reduce(reduce, []).sortBy("count").reverse().value();
	},

	viewsByRegion(data, addresses) {
		return _.chain(data).filter(i => !i.http_status_code.startsWith("4")).map(i => addresses[i.remote_address] || unknown).map(i => {
			return {
				region: `${i.region}, ${i.country}`,
				count: 0
			}
		}).groupBy(i => i.region).reduce(reduce, []).sortBy("count").reverse().value();
	},

	viewsByCity(data, addresses) {
		return _.chain(data).filter(i => !i.http_status_code.startsWith("4")).map(i => addresses[i.remote_address] || unknown).map(i => {
			return {
				city: `${i.city}, ${i.region}, ${i.country}`,
				count: 0
			}
		}).groupBy(i => i.city).reduce(reduce, []).sortBy("count").reverse().value();
	}
};