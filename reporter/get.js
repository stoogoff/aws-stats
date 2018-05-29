"use strict";

const _ = require("underscore");

module.exports = {
	// total views by date
	viewsByDate(data) {
		return _.chain(data).map(i => i.date).reduce((memo, current) => {
			if(!memo[current]) {
				memo[current] = 0;
			}

			memo[current]++;

			return memo;
		}, {}).map((val, key) => {
			return {
				date: key,
				count: val
			};
		}).sortBy("date").value();
	},

	// total views to a given URL in the time period
	viewsByURL(data) {
		return _.chain(data).map(i => {
			return {
				url: `${i.domain}/${i.path}`,
				count: 0
			}
		}).groupBy(i => i.url).reduce((memo, current) => {
			let o = current[0];

			o.count = current.length;

			memo.push(o);

			return memo;
		}, []).sortBy("count").reverse().value();
	},

	viewsByReferrer(data) {
		return _.chain(data).map(i => {
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
		}).groupBy(i => i.referrer).reduce((memo, current) => {
			let o = current[0];

			o.count = current.length;

			memo.push(o);

			return memo;
		}, []).sortBy("count").reverse().value();
	}
};