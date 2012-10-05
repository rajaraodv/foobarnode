 var express = require('express');
 module.exports = function(app, service) {
    app.use(express.bodyParser({
        uploadDir: __dirname + '/../public/uploads'
    }));
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/../public'));
    app.use(finalReqErrorHandler);

    app.get('/', function(req, res) {
        res.sendfile('index.html');
    });
 };

 function finalReqErrorHandler(err, req, res, next) {
    res.json(500, {
        "Error": err.message + ". Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
    });
 }

 