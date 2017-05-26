# express-brute-nedb

[![NPM version](http://img.shields.io/npm/v/express-brute-nedb.svg)](https://www.npmjs.com/package/express-brute-nedb)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/natsukagami/express-brute-nedb/blob/master/LICENSE)

##### An express-brute store using nedb

### Installation

```shell
npm install express-brute-nedb
```
### Usage

```js
const ExpressBrute = require('express-brute'),
      ExpressBruteNedbStore = require('express-brute-nedb');

const store = new ExpressBruteNedbStore({
    filename: './brute.db' // See all available options below
});
const bruteforce = new ExpressBrute(store);

app.post('/auth',
    bruteforce.prevent, // error 429 if we hit this route too often
    (req, res, next) => {
        res.send('Success!');
    }
);
```
### Options

Available parameters:

- `filename` Path to the database file. If left empty, in-memory database is used. Defaults to nothing (which is NOT recommended).
- `prefix` A prefix to the keys used in express-brute. However, multiple instances of express-brute have their own unique keys so it is not needed to provide a prefix at all. 
- `debug` Set a debug function, that receives an error when something goes wrong. Defaults to `noop`.
- `compactInterval` Sets an interval to auto-compact the NeDB database file. This is required since the write-only policy of NeDB, used with large write count of Express Brute can produce a very large file. The default interval is 2 minutes (120000 miliseconds).

### License

MIT
