var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

const crypto = require('crypto');
var initializeDatabases = require('../db');
const USERS_COLLECTION = 'users';

initializeDatabases(function(err, dbs) {
  if(err){
    console.log(err);
  }
  console.log(dbs.production);
  var usersCollection = dbs.production.collection(USERS_COLLECTION);
  
  passport.use(new LocalStrategy({
    usernameField: 'user[email]',
    passwordField: 'user[password]'
  }, function(email, password, done) {
    console.log(email);
    console.log(password);
    
    var query = { email: email };
    usersCollection.findOne(query,function(err, user){
      console.log(user);
      let userFromDB =user;
      console.log(JSON.stringify(userFromDB));
      if(typeof(userFromDB) === 'undefined'){
        return done(null, false);
      }
      let passwordFromDB = userFromDB.hash;
      let hashPassword = crypto.pbkdf2Sync(password, userFromDB.salt, 10000, 512, 'sha512').toString('hex');
      console.log("passwordFromDB" + passwordFromDB);
      console.log("hashPassword" + hashPassword);
      if(user == null  || passwordFromDB !== hashPassword){
        console.log("before invalid done ");
        return done(null, false);
      }
      console.log("before valid done ");
      return done(null, user);
    }).catch(done);
  }));

});
