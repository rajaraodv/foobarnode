var express = require('express');
var service = require('./service');
var configure = require('./app-configure.js');


var controllers = require('./controllers.js');
module.exports = function(app, mongoose) {
	service.init(mongoose);
	configure(app, service);
	controllers(app, mongoose, service);
};