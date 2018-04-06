var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const mysql = require("mysql");
const q = require("q");
const crypto = require('crypto');

var makeQuery = function (sql, pool) {
  console.log(sql);
  return function (args) {
      var defer = q.defer();
      pool.getConnection(function (err, conn) {
          if (err) {
              defer.reject(err);
              return;
          }
          conn.query(sql, args || [], function (err, results) {
              conn.release();
              if (err) {
                  defer.reject(err);
                  return;
              }
              defer.resolve(results);
          });
      });
      return defer.promise;
  }
};

var pool = mysql.createPool({
  host: process.env.MYSQL_SERVER,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: process.env.MYSQL_CONNECTION
});

const getOneUserByEmailSql = "SELECT username, email, bio, hash, salt, imageurl FROM users where email=?";
var getOneUserByEmail = makeQuery(getOneUserByEmailSql, pool);

passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]'
}, function(email, password, done) {
  console.log(">>> email " + email);
  console.log(">>> password " + password);
  
  getOneUserByEmail([email]).then(user=>{
    let userFromDB =user[0];
    console.log(userFromDB);
    console.log(userFromDB.salt);
    let passwordFromDB = userFromDB.password;
    let hashPassword = crypto.pbkdf2Sync(password, userFromDB.salt, 10000, 512, 'sha512').toString('hex');
    if(user == null  && passwordFromDB !== hashPassword){
      return done(null, false);
    }
    console.log("Passport > " + JSON.stringify(user));
    return done(null, user);
  }).catch(done);
}));

