// Google OAuth2
var router = require("express").Router();
const passport = require("passport");
const ensureAuthenticated = require("../middleware/ensureAuthenticated.js")
const dbHandler = require("../db.js")
const genericRepsponses = require('../genericResponses.js');

var db = undefined

router.get("/google/",
  passport.authenticate('google', { scope: [
     'https://www.googleapis.com/auth/plus.login',
     'https://www.googleapis.com/auth/plus.profile.emails.read']
}));

router.get("/google/callback",
    passport.authenticate( 'google', {
    successRedirect: '/auth/user',
    failureRedirect: '/auth/fail'
}));

router.get("/user", function(req, res){
  HaveDatabaseInstance();
  if( !req.isAuthenticated() )
  {
      res.redirect("/auth/google");
      return;
  }

  if( !req.session.isInnovoteAuthenticated )
  {
    db.collection("users").find({ "email" : req.user.email }, { '_id' : false }).toArray(function(err, result){
      if(err)
      {
        console.error(err.stack);
        genericRepsponses.internalError(res);
      } else {
        if( result.length == 0 ) {
          genericRepsponses.forbidden(res);
        }
        else {
          if( result.length != 1 )
          {
            console.error("Multiple accounts found during authentication for " + req.user.email );
          }
          req.session.isInnovoteAuthenticated = true;
          req.session.isTeacher = result[0].isTeacher;
          req.session.classContext = undefined;
          res.redirect("/");
        }
      }
    });
  }
  else
  {
    res.redirect("/");
  }
});

router.get("/logout", function(req, res) {
  req.session.destroy(function (err) {
      res.redirect('/'); //Inside a callback… bulletproof!
  });
});

router.get("/fail", function(req, res) {
    genericRepsponses.internalError(res);
});

// Ensures we have a DB instance.
function HaveDatabaseInstance() {
  if( db == undefined )
    db = dbHandler.getDatabaseInstance();
}

module.exports = router;
