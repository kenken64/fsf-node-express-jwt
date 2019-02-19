var router = require('express').Router();
var passport = require('passport');

var auth = require('../auth');
var jwt = require('jsonwebtoken');
var secret = require('../../config').secret;
const crypto = require('crypto');
const DbConnection = require('../../db');

router.get('/users', auth.required, function(req, res, next){
  DbConnection.instance.getAllUsers([]).then(result=>{
    res.status(200).json(result);
  }).catch(error=> {
    console.log(error);
    res.status(500).json(error);
  })
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
    DbConnection.instance.getOneUserByEmail([user.email]).then(result=>{
      console.log("found user !");
      if(result != null){
        DbConnection.instance.updateUser([user.bio, user.image, user.email]).then(updatedResult=>{
          console.log(updatedResult);
          res.status(200).json(updatedResult);
        }).catch(error=> {
          console.log(error);
          res.status(500).json(error);
        })
      }else{
        res.status(500).json({error: 'error updating record'});
      }
    }).catch(error=> {
      console.log(error);
      res.status(500).json(error);
    })
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
  DbConnection.instance.saveOneUser([username, email, null, hashPassword, saltValue, null ]).then(result=>{
    res.status(200).json(result);
  }).catch(error=> {
    console.log(error);
    res.status(500).json(error);
  })
});

function generateJWT(email) {
  return jwt.sign({
    id: this._id,
    username: this.username,
    data: {email: 'email'},
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
  }, secret);
};

module.exports = router;