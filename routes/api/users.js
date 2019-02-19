var router = require('express').Router();
var passport = require('passport');

var auth = require('../auth');
var jwt = require('jsonwebtoken');
var secret = require('../../config').secret;
const crypto = require('crypto');
var initializeDatabases = require('../../db');
//const DbConnection = require('../../db');

const USERS_COLLECTION = 'users';

initializeDatabases(function(err, dbs) {
  if(err){
    console.log(err);
    return;
  }
  var usersCollection = dbs.production.collection(USERS_COLLECTION);
  
  router.get('/users', auth.required, function(req, res, next){
    usersCollection.find()
        .toArray(function(err, users){
        res.status(200).json(users);
    });
  });

  router.get('/unauthorized', function(req, res, next){
    res.status(401 ).json("invalid login");
  });

  router.put('/users', auth.required, function(req, res, next){
      console.log(req.body);
      let user = {
        // empty
      }
      // only update fields that were actually passed...
      if(typeof req.body.user.email !== 'undefined'){
        user.email = req.body.user.email;
      }
      if(typeof req.body.user.bio !== 'undefined'){
        user.bio = req.body.user.bio;
      }
      if(typeof req.body.user.image !== 'undefined'){
        user.image = req.body.user.image;
      }
      console.log(user.email);
      var query = { email: user.email };
      usersCollection.updateOne(
          query,
          { $set: { "bio" : user.bio,
          "image" : user.image
        } },
          { upsert: true }
      );

      res.status(200).json(user);

  });

  router.post('/login', function(req, res, next){
    console.log("login ...");
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
        user.token = generateJWT(user.email);
        console.log("JWT token : > " + user.token);
        delete user.hash;
        delete user.salt;
        return res.json({user: user});
      } else {
        return res.status(401).json({errorMessage: "invalid username or password"});
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
    // find user by email 
    let user = {
      username: username,
      email: email,
      password: hashPassword
    }
    judgesCollection.insertOne(user, function(err, r) {
      console.log(err);
      res.status(200).json(r);
    }).catch(error=> {
      console.log(error);
      res.status(500).json(error);
    });
  });

  function generateJWT(email) {
    return jwt.sign({
      id: this._id,
      username: this.username,
      data: {email: 'email'},
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
    }, secret);
  };
  return router;
});