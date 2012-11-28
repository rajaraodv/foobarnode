/*global module require __dirname */
/*jshint quotmark:single */
'use strict';

 var express = require('express');
 var everyauth = require('everyauth');


 module.exports = function(app, service) {


     app.use(express.bodyParser({
         uploadDir: __dirname + '/../public/uploads'
     }));
     app.use(express.methodOverride());
     app.use(express.cookieParser('htuayreve'));
     app.use(express.session());

     app.use(finalReqErrorHandler);

    app.configure('development',
    function() {
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
        /*
          Use html files from foobar's client project which is kept next to this foobarnode (server) project
          Client project is at: https://github.com/rajaraodv/foobarwebclient
         */
        app.use(express['static'](__dirname + '/../../foobarwebclient/app/'));
    });

    app.configure('production',
    function() {
        console.log('in production..');
        app.use(express.errorHandler());
                /*
                Run *modified* 'yeoman build' in https://github.com/rajaraodv/foobarwebclient. It copies compiled
                files to foobarnode/client folder. PS: keep foobarnode (server) and client(client) project next
                to each other
                */
        app.use(express['static'](__dirname + '/../client/'));
    });
 };

 function finalReqErrorHandler(err, req, res, next) {
     res.json(500, {
         'Error': err.message + '. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid'
     });
 }