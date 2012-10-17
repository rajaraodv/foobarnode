    /* server */
    var express = require('express');
    var app = express();
    var mongoose = require('mongoose');
   var bootstrap = require('./init/bootstrap')(app, mongoose);
    module.exports = {app: app, mongoose: mongoose};
    if(!module.parent) {
        //only start if called directly (and not from tests)
        console.log(2111);
        mongoose.connect('mongodb://127.0.0.1/sampledb');
        app.listen(3000);
        console.log("listening on port %d", 3000);
    }