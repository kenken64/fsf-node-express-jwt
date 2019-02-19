require('dotenv').config();
var async = require('async');
var MongoClient = require('mongodb').MongoClient;

var PROD_URI = process.env.MONGODB_URL;
console.log(">>>" + PROD_URI);
MongoClient.connect(PROD_URI, { useNewUrlParser: true });
var databases = {
  production: async.apply(MongoClient.connect, PROD_URI, { useNewUrlParser: true }),
};
console.log(">>>" + JSON.stringify(databases.production));
module.exports = function (cb) {
  async.parallel(databases, cb);
};