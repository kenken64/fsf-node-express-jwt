require('dotenv').config();
var MongoClient = require('mongodb').MongoClient(process.env.MONGODB_URL, { useNewUrlParser: true });
const assert = require('assert');
console.log(MongoClient);
// Database Name
const dbName = 'testdb';
MongoClient.connect(function(err, client) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
  
    const db = client.db(dbName);
    var child3 = {
      a1: "hi",
      b2: "No"
    }
    var person = {
      firstName: "Kenneth",
      lastName: "Phang",
      a: {b: "c", d: [1,2,4,5], e: child3}
    }

    var fruits = [
      {name: "Apple", quantity: 10},
      {name: "Orange", quantity: 20},
      {name: "Pineapple", quantity: 10},
      {name: "Durian", quantity: 30},
      
    ]
    // Insert a single document
    db.collection('parent_col').insertOne(person, function(err, r) {
      assert.equal(null, err);
      assert.equal(1, r.insertedCount);
      console.log("R id" + r.insertedId);

      var childObj = {
        name: "Child name 1",
        c_col123: r.insertedId
      }
      db.collection("child_parent_col").insertOne(childObj, (err, r)=>{
        console.log(r);
      })
  
      // Insert multiple documents
      db.collection('cart').insertMany(fruits, function(err, r) {
        assert.equal(null, err);
        assert.equal(4, r.insertedCount);
  
        client.close();
      });
      var query = {};

      db.collection('cart').find(query).toArray((err, result)=>{
        console.log(result);
      });
      console.log("--------------");
      db.collection('cart').find({quantity: 10}).toArray((err, result)=>{
        console.log(result);
      });

      db.collection('cart').count({quantity: 10}, (err, cntResult)=>{
        console.log(cntResult);
      });
    });
  });