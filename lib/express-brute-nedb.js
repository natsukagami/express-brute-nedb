const brute = require('express-brute');
const nedb = require('nedb');

/**
 * A function that does nothing
 */
const noop = () => {};

/**
 * Implements NeDB store for express-brute
 */
class nedbStore extends require('express-brute/lib/AbstractClientStore') {
	/**
	 * @constructor
	 * @param {Object} options
	 * @param {string} [options.prefix=''] The cells' prefix
	 * @param {string} [options.filename] The data file's name. Leave blank for in-memory store.
	 * @param {Function} [options.debug=noop] The function that prints debug messages.
	 * @param {Number} [compactInterval=120000] The time (in Miliseconds) between every NeDB compaction action.
	 */
	constructor({
		prefix = '',
		filename, // Leave blank for in-memory
		debug = noop,
		compactInterval = 120000
	}) {
		super();
		/**
		 * The cells' prefix
		 * @type {string}
		 */
		this.prefix = prefix;
		/**
		 * The actual database
		 * @type {nedb}
		 * @private
		 */
		this.db = new nedb({
			filename: filename,
			autoload: !!filename // something -> true -> false
		});
		this.db.persistence.setAutocompactionInterval(compactInterval);
		/**
		 * The debug function
		 * @type {Function}
		 */
		this.debug = debug;
	}
	/*
	 * key: The updater's key,
	 * value: { count: number, lastRequest: Date, firstRequest: Date }
	 * lifetime: in seconds
	 */
	/**
 	 * Sets the value of a key
	 * @param {string} key The key to be updated
	 * @param {string} value The value
	 * @param {Number} lifetime Time to live (in seconds)
	 * @param {nedbStore.doneCallback} [callback=noop]
	 */
	set(key, value, lifetime, callback = noop) {
		this.__setRow(key, value, lifetime, callback);
	}
	/**
	 * Gets the row of the given key
	 * @param {string} key The key to be queried
	 * @param {nedbStore.getCallback} [callback=noop]
	 */
	get(key, callback = noop) {
		this.__getRow(key, (err, row) => {
			if (err) return callback(err);
			if (row === null) return callback(null, null);
			callback(null, row.content);
		});
	}
	/**
	 * Resets the row of the given key
	 * @param {string} key The key to be updated
	 * @param {nedbStore.doneCallback} [callback=noop]
	 */
	reset(key, callback = noop) {
		this.__removeRow(key, callback);
	}
	/**
	 * Gets the specified row, removes if its lifetime is over
	 * @param {string} key The key to be queried
	 * @param {nedbStore.getCallback} callback
	 * @private
	 */
	__getRow(key, callback) {
		this.db.findOne({ key: this.prefix + key }, (err, row) => {
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
	/**
 	 * Sets the value of a key
	 * @param {string} key The key to be updated
	 * @param {string} value The value
	 * @param {Number} timeout Time to live (in seconds)
	 * @param {nedbStore.doneCallback} callback
	 * @private
	 */
	__setRow(key, value, timeout, callback) {
		this.__getRow(key, (err, row) => {
			if (err) return callback(err);
			if (row === null) {
				return this.db.insert({
					key: this.prefix + key,
					content: JSON.stringify(value),
					expires: (new Date()).getTime() + timeout * 1000
				}, callback);
			} else {
				return this.db.update({ key: this.prefix + key }, {
					$set: {
						content: JSON.stringify(value),
						expires: (new Date()).getTime() + timeout * 1000
					}
				}, callback);
			}
		});
	}
	/**
	 * Removes the row of the given key
	 * @param {string} key The key to be updated
	 * @param {nedbStore.doneCallback} callback
	 * @private
	 */
	__removeRow(key, callback) {
		return this.db.remove({ key: this.prefix + key }, {}, callback);
	}
}

/**
 * A callback with only one argument `err`, called when the asynchronorous work is done.
 * @callback nedbStore.doneCallback
 * @param {?Error} err The error occured, if any
 */

/**
 * A callback with two arguments `err` and `row`, returning a express-brute store-compatible row.
 * @callback nedbStore.getCallback
 * @param {?Error} err The error occured, if any
 * @param {?Object} row The row is null if no row was found.
 * @param {Number} row.count The number of times the brute call happened.
 * @param {Date} row.lastRequest The last request occured
 * @param {Date} row.firstRequest The first request occured
 */

module.exports = nedbStore;
