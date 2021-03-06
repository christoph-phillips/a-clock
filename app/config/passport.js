'use strict';

//STRATEGIES

var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var StravaStrategy = require('passport-strava-oauth2').Strategy;

var User = require('../models/users');
var configAuth = require('./auth');


module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});
	
        //STRAVA STRATEGY

    passport.use(new StravaStrategy({

     clientID        : configAuth.stravaAuth.clientID,
     clientSecret    : configAuth.stravaAuth.clientSecret,
     callbackURL     : configAuth.stravaAuth.callbackURL,
     passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function() {


            // find the user in the database based on their facebook id
            User.findOne({ 'strava.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser = new User();
                    
                    
                    // set all of the facebook information in our user model
                   console.log(profile)
                    newUser.strava.id = profile.id;
                    newUser.strava.email = profile._json.email;
                    newUser.strava.token = profile.token;
                    

                    newUser.strava.firstName = profile._json.firstname;
                    newUser.strava.secondName = profile._json.lastname;
                    newUser.strava.profileImg = profile._json.profile_medium;
                    newUser.strava.city = profile._json.city;
                    newUser.strava.country = profile._json.country;

                    /*
                    //ADD IN OTHER FIELDS FOR LATER
                    newUser.facebook = {};
                    newUser.local = {};
                    */
                                    // save the user
                    newUser.tips = [];
                    newUser.descriptions = [];
                    newUser.guideCities = [];

                  
                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                     
                }

            });


        });
  }
));
	
	   //LOCAL
    //SIGNUPS STRATEGY
 passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false/*, req.flash('signupMessage', 'That username is already taken.')*/)
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = new User();

                // set the user's local credentials
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);
                newUser.local.name = req.body.name;
                newUser.local.profileImg = "/public/images/profile.png"
                // save the user
                newUser.tips = [];
                newUser.descriptions = [];
                newUser.guideCities = [];

                /*
                //ADD IN OTHER FIELDS FOR LATER
                newUser.facebook = {};
                newUser.strava = {};
                */
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }

        });    

        });

    }));

passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false/*, req.flash('loginMessage', 'No user found.')*/); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false/*, req.flash('loginMessage', 'Oops! Wrong password.')*/); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));




 passport.use(new FacebookStrategy({
        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name', 'displayName', 'picture.type(large)']
    },

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser = new User();
                    console.log(profile)
					
                    // set all of the facebook information in our user model
                    newUser.facebook.id    = profile.id; // set the users facebook id                   
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                    newUser.facebook.firstName  = profile._json.first_name; // look at the passport user profile to see how names are returned
                    newUser.facebook.secondName  = profile._json.last_name;
                    newUser.facebook.picture = profile.photos[0].value;
                    newUser.facebook.email = profile.emails[0].value;
                    newUser.facebook.profileImg = profile.photos[0].value;

                     // facebook can return multiple emails so we'll take the first
                    newUser.tips = [];
                    newUser.descriptions = [];
                    newUser.guideCities = [];

                    /*
                    //ADD OTHER FIELDS FOR LATER
                    newUser.strava = {};
                    newUser.local = {};
                    */
                
   
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                }

            });
        });

    }));



	
	
};
