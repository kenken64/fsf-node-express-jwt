var router = require('express').Router();

module.exports = function(dbs) {
  router.use('/', require('./users')(dbs));
  outer.use('/payment', require('./payment'));
}


router.use(function(err, req, res, next){
  console.log(JSON.stringify(err));
  if(err.name === 'ValidationError'){
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce(function(errors, key){
        errors[key] = err.errors[key].message;

        return errors;
      }, {})
    });
  }

  return next(err);
});

module.exports = router;