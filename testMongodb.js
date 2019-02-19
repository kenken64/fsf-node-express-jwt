require('dotenv').config();
var MongoClient = require('mongodb').MongoClient(process.env.MONGODB_URL, { useNewUrlParser: true });
const assert = require('assert');
console.log(MongoClient);
// Database Name
const dbName = 'users';
MongoClient.connect(function(err, client) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
  
    const db = client.db(dbName);
  
    // Insert a single document
    db.collection('inserts').insertOne({a:1}, function(err, r) {
      assert.equal(null, err);
      assert.equal(1, r.insertedCount);
  
      // Insert multiple documents
      db.collection('inserts').insertMany([{a:2}, {a:3}], function(err, r) {
        assert.equal(null, err);
        assert.equal(2, r.insertedCount);
  
        client.close();
      });
    });
  });