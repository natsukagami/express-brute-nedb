const brute = require('express-brute');
const nedb = require('nedb');

const noop = () => {};

class nedbStore extends require('express-brute/lib/AbstractClientStore') {
	constructor({
		prefix = '',
		filename, // Leave blank for in-memory
		debug = noop
	}) {
		super();
		this.prefix = prefix;
		this.db = new nedb({
			filename: filename,
			autoload: !!filename // something -> true -> false
		});
		this.debug = debug;
	}
	/**
	 * key: The updater's key,
	 * value: { count: number, lastRequest: Date, firstRequest: Date }
	 * lifetime: in seconds
	 */
	set(key, value, lifetime, callback = noop) {
		this.__setRow(key, value, lifetime, callback);
	}
	get(key, callback = noop) {
		this.__getRow(key, (err, row) => {
			if (err) return callback(err);
			callback(null, row.content);
		});
	}
	reset(key, callback = noop) {
		this.__removeRow(key, callback);
	}
	/**
	 * Gets the specified row, removes if its lifetime is over
	 */
	__getRow(key, callback) {
		this.db.findOne({ key: prefix + key }, (err, row) => {
			if (err) return callback(err);
			if (row === null) return callback(null, null);
			if (new Date(row.expires) < new Date()) {
				return this.__removeRow(key, err => callback(err, null));
			}
			const c = JSON.parse(row.content);
			return callback(null, {
				key: row.key,
				content: {
					count: c.count,
					lastRequest: new Date(c.lastRequest),
					firstRequest: new Date(c.firstRequest)
				},
				expires: c.expires
			});
		});
	}
	__setRow(key, value, timeout, callback) {
		this.__getRow(key, (err, row) => {
			if (err) return callback(err);
			if (row === null) {
				return this.db.insert({
					key: prefix + key,
					content: JSON.stringify(value),
					expires: (new Date()).getTime() + timeout * 1000
				}, callback);
			} else {
				return this.db.update({ key: prefix + key }, {
					$set: {
						content: JSON.stringify(value),
						expires: (new Date()).getTime() + timeout * 1000
					}
				}, callback);
			}
		});
	}
	__removeRow(key, callback) {
		return this.db.remove({ key: prefix + key }, {}, callback);
	}
}

module.exports = nedbStore;
