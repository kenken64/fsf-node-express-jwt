var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

const crypto = require('crypto');
const DbConnection = require('../db');

passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]'
}, function(email, password, done) {
  console.log(email);
  console.log(password);
  
  DbConnection.instance.getOneUserByEmail([email]).then(user=>{
    let userFromDB =user[0];
    console.log(JSON.stringify(userFromDB));
    if(typeof(userFromDB) === 'undefined'){
      return done(null, false);
    }
    let passwordFromDB = userFromDB.hash;
    let hashPassword = crypto.pbkdf2Sync(password, userFromDB.salt, 10000, 512, 'sha512').toString('hex');
    if(user == null  || passwordFromDB !== hashPassword){
      return done(null, false);
    }
    return done(null, user);
  }).catch(done);
}));

