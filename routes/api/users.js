var router = require('express').Router();
var passport = require('passport');

var auth = require('../auth');
var jwt = require('jsonwebtoken');
var secret = require('../../config').secret;
const mysql = require("mysql");
const crypto = require('crypto');
const q = require("q");

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

const saveOneUserSql = "INSERT INTO users (username, email, bio, hash, salt, imageurl) VALUES (? ,? ,? ,?,?,?)";
const getAllUsersSql = "SELECT username, email, bio, hash, salt, imageurl FROM users";

var saveOneUser = makeQuery(saveOneUserSql, pool);
var getAllUsers = makeQuery(getAllUsersSql, pool);

router.get('/users', auth.required, function(req, res, next){
  getAllUsers([]).then(result=>{
    res.status(200).json(result);
  }).catch(error=> {
    console.log(error);
    res.status(500).json(error);
  })
});

router.put('/users', auth.required, function(req, res, next){
  
    // only update fields that were actually passed...
    if(typeof req.body.user.username !== 'undefined'){
      user.username = req.body.user.username;
    }
    if(typeof req.body.user.email !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.bio !== 'undefined'){
      user.bio = req.body.user.bio;
    }
    if(typeof req.body.user.image !== 'undefined'){
      user.image = req.body.user.image;
    }
    if(typeof req.body.user.password !== 'undefined'){
      user.setPassword(req.body.user.password);
    }

    return res.json({});
});

router.post('/users/login', function(req, res, next){
  if(!req.body.user.email){
    return res.status(422).json({errors: {email: "can't be blank"}});
  }

  if(!req.body.user.password){
    return res.status(422).json({errors: {password: "can't be blank"}});
  }
  //let user = req.body.user;

  passport.authenticate('local', {session: false}, function(err, user, info){
    if(err){ return next(err); }

    if(user){
      user.token = generateJWT();
      console.log("JWT token : > " + user.token);

      return res.json({user: user});
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

router.post('/users', function(req, res, next){
  
  var username = req.body.user.username;
  var email = req.body.user.email;
  var password = req.body.user.password;
  let saltValue = crypto.randomBytes(16).toString('hex');
  console.log("saltValue > " + saltValue);
  //user.setPassword(req.body.user.password);
  let hashPassword = crypto.pbkdf2Sync(password, saltValue, 10000, 512, 'sha512').toString('hex');
  saveOneUser([username, email, null, hashPassword, saltValue, null ]).then(result=>{
    res.status(200).json(result);
  }).catch(error=> {
    console.log(error);
    res.status(500).json(error);
  })
});

router.get('/users/logout', function(req, res, next){
  console.log(req.user);
  console.log(req.session);
  req.logout();
  console.log(req.user);
  res.status(200).json({});
});

function generateJWT() {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, secret);
};



module.exports = router;
