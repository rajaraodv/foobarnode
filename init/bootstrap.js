var express = require('express');
var service = require('./service');
var configure = require('./app-configure.js');
var mongoose = require('mongoose');


var controllers = require('./controllers.js');
module.exports = function(app) {
	service.init(mongoose);

	configure(app, service);
	controllers(app, mongoose, service);
	
	mongoose.connect('mongodb://127.0.0.1/sampledb');

	app.listen(3000);
	console.log("listening on port %d", 3000);
};