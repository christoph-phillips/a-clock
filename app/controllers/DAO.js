'use strict';

var Users = require('../models/users.js');
var fs = require("fs")
var Cities = require('../models/cities.js');

var Q = require("q");

function DAO () {


	this.getHotelValues = function() {

		var deferred = Q.defer();

		var functions = [];

		functions.push(getValue("max"))
		functions.push(getValue("min"))

		Q.all(functions).then(function(data) {
			var prices = [];

			data.forEach(function(value) {
				prices.push(value[0].cost.hotel.USD)
			})

			deferred.resolve(prices);
		}).catch(function(error) {
			console.log(error)
			deferred.reject(error);
		})

		return deferred.promise;

		function getValue(type) {

			var deferred = Q.defer();
			var sorter = -1;
			if (type === "max") {
				sorter = 1;
			}

			Cities.find({}, {"cost.hotel.USD": 1, _id: 0})
				.sort({"cost.hotel.USD": sorter})
				.limit(1)
				.exec(function (err, result) {
					if (err) { 
						deferred.reject(err);
					}
					else {
						deferred.resolve(result);

					}
				});

			return deferred.promise;

		}

		


	},

	this.getAllCities = function(query) {
		var deferred = Q.defer();
		Cities.find(query.query, query.projection)
			.sort(query.sort)
			.limit(query.limit)
			.exec(function (err, result) {
				if (err) { 
					deferred.reject(err);
				}
				else {
					deferred.resolve(result);

				}
			});

		return deferred.promise;

	},

	this.getSingleCity = function(query) {
		var deferred = Q.defer();


		Cities.findOne(query.query, query.projection)
			.exec(function (err, result) {
				if (err) { 
					deferred.reject(err)
				}
				else {
					deferred.resolve(result)
				}
			});

		return deferred.promise;

	},


	this.getTips = function(slug) {
		var deferred = Q.defer();

		var query = {"info.city.slug": slug}

		Cities
			.findOne(query, {"running.tips": 1, "riding.tips": 1})
			.exec(function (err, result) {
				if (err) { 
						deferred.reject(err)
					}
					else {
						deferred.resolve(result)
				}

			});

			return deferred.promise;


	},

	this.addTip = function(user, activity, slug, tip) {

		var date = new Date();

		var functions = [];

		functions.push(updateUser())
		functions.push(updateCity())

		Q.all(functions).then(function(data) {

		}).catch(function(error) {
			console.log(error)
		});

		 //THIS WILL CHANGE FOR NEW USERS - 


		function updateUser() {
			var deferred = Q.defer();

			var tipObj = {
			activity: activity,
			slug: slug,
			tip: tip,
			date: date
			}

			var query = {"facebook.id": 10100866060381880};

			Users
			.findOneAndUpdate(query, { $push: {tips: tipObj} }, {"new": true})
			.exec(function (err, result) {
				if (err) { 
						deferred.reject(err)
					}
					else {
						deferred.resolve(result)
				}

			});

			return deferred.promise;

		}

		function updateCity() {

			var deferred = Q.defer();

			var query = {"info.city.slug" : slug}

			var tipObj = {
			activity: activity,
			tip: tip,
			date: date,
			user: user
			}


			var prop = activity + ".tips" //or ""Year"
			var push = {};
			push[prop] = tipObj;

			Cities
			.findOneAndUpdate(query, { $push: push}, {"new": true})
			.exec(function (err, result) {
				if (err) { 
						deferred.reject(err)
					}
					else {
						deferred.resolve(result)
				}

			});

			return deferred.promise;

		}
		
	},

	this.addDescription = function(slug, description, user) {

		var date = new Date();

		var functions = [];

		functions.push(updateUser())
		functions.push(updateCity())

		Q.all(functions).then(function(data) {
		}).catch(function(error) {
			console.log(error)
		});


		function updateUser() {
			var deferred = Q.defer();

			var descObj = {
			description: description,
			user: user,
			date: date,
			slug: slug
			}


			var query = {"facebook.id": 10100866060381880};

			Users
			.findOneAndUpdate(query, { $push: {descriptions: descObj} }, {"new": true})
			.exec(function (err, result) {
				if (err) { 
						deferred.reject(err);
					}
					else {
						deferred.resolve(result);
				}

			});

			return deferred.promise;

		}

		function updateCity() {

			var deferred = Q.defer();

			var query = {"info.city.slug" : slug}

			var descObj = {
			description: description,
			user: user,
			date: date
			}

			Cities
			.findOneAndUpdate(query, { $set: {description: descObj}}, {"new": true})
			.exec(function (err, result) {
				if (err) { 
						deferred.reject(err)
					}
					else {
						deferred.resolve(result)
				}

			});

			return deferred.promise;
		}

	},

	this.getDescription = function(slug) {
		var deferred = Q.defer();

		var query = {"info.city.slug": slug}

		Cities
			.findOne(query, {"description.description": 1})
			.exec(function (err, result) {
				if (err) { 
						deferred.reject(err)
					}
					else {
						deferred.resolve(result)
				}

			});

			return deferred.promise;

	},

	this.getTotals = function() {

		var functions = [];

		functions.push(getTop3({"running.runnerCount": -1}))
		functions.push(getTop3({"riding.riderCount": -1}))
		functions.push(getTop3({"weather.elevation": -1}))
		functions.push(getTop3({"cost.hotel.USD": 1}))

		function getTop3(field) {

			var deferred = Q.defer();

			Cities.find({}, {info: 1, _id: 0})
				.limit(3)
				.sort(field)
				.exec(function (err, result) {
					if (err) { 
						deferred.reject(err);
					}
					else {
						deferred.resolve(result);
					}
				});

			return deferred.promise;

		}


		return Q.all(functions);

	},

	this.getCityNames = function() {
		var deferred = Q.defer();

			Cities.find({}, {"info.city.name": 1, "info.country.name": 1, "info.city.slug": 1, _id: 0})
				.exec(function (err, result) {
					if (err) { 
						deferred.reject(err);
					}
					else {
						deferred.resolve(result);
					}
				});

			return deferred.promise;

	},


	this.getUsers = function(req, res) {

		var username = req.params.user;
		var message;

		Users.find({}, { "local.username": 1, _id: 0 })
			.exec(function (err, result) {
					if (err) { throw err; }
					var taken = false;
					result.map(function(user) {
						console.log(user)
						if (user.local.username === username) {

							message = "That username is taken."
							var obj = {}
							obj.message = message
							obj.alert = "warning"
					
							res.json(obj)
							taken = true;
						}
					})
					if (!taken) {
						message = "Your username is available."
						var obj = {}
						obj.message = message
						obj.alert = "success"
						res.json(obj)
					}

				});

	},



	this.addUserInfo = function(req, res) {
		var country = req.body.country;
		var city = req.body.city;
		var fullName = req.body.fullName

		//CUSTOM QUERY BASED ON FACEBOOK OR LOCAL LOGIN
			var query = {"twitter.id": req.user.twitter.id};
			if (req.user.local.username) {
				query = {"local.username": req.user.local.username};
			}
		
		Users
			.findOneAndUpdate(query, { $set: { country: country, city: city, fullName: fullName } }, {"new": true})
			.exec(function (err, result) {
					if (err) { throw err; }
					
					var user = {};
					user.city = result.city;
					user.country = result.country;
					user.fullName = result.fullName
					

					res.json(user);
					
					});
	
	},

	this.changePass = function(req, res, next) {
		//req.body contains currentpass, newpass and newpassconfirmed
		if (req.body.newpass !== req.body.newpassconfirmed) {
        throw new Error('password and confirm password do not match');
     }

     var User = req.user;

     User.local.password = req.body.newpass;
     
     //PASSPORT SHOULD RECOGNISE THAT PASSWORD IS CHANGED AND HASH IT BEFORE SAVING....
     User.save(function(err, result){
         if (err) { next(err) }
         else {
             res.json(result)
         }
     });

	},


	this.getUserDetails = function(req, res) {

		var query = {"twitter.id": req.user.twitter.id};
			if (req.user.local.username) {
				query = {"local.username": req.user.local.username};
			}

		Users.findOne(query, { _id: 0 })
			.exec(function (err, result) {
					if (err) { throw err; }
				var name = result.fullName || result.local.username || result.twitter.username;
				var country = result.city;
				var city = result.country;

				var user = {}
				user.name = name;
				user.city = city;
				user.country = country;

				res.json(user)
			});


		}


}

module.exports=DAO;