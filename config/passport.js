var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

const crypto = require('crypto');
const DbConnection = require('../db');

passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]'
}, function(email, password, done) {
  
  DbConnection.instance.getOneUserByEmail([email]).then(user=>{
    let userFromDB =user[0];
    let passwordFromDB = userFromDB.password;
    let hashPassword = crypto.pbkdf2Sync(password, userFromDB.salt, 10000, 512, 'sha512').toString('hex');
    if(user == null  && passwordFromDB !== hashPassword){
      return done(null, false);
    }
    return done(null, user);
  }).catch(done);
}));

