var request = require('request');
var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();

var mongoose = require('mongoose');
var simpleTimestamps = require('./../lib/utils/simpleTimestamps').SimpleTimestamps;

var user = require('./../lib/models/user')(mongoose, simpleTimestamps);

// Connecting to a local test database or creating it on the fly
mongoose.connect('mongodb://localhost/user_test');


describe('Users', function(){
  var currentUser = null;

  /*
   * beforeEach Method
   *
   * The before each method will execute every time Mocha is run. This
   * code will not run every time an individual test is run.
   */

  beforeEach(function(done){
    user.register('test@test.com', 'password', function(doc){
      currentUser = doc;
      done();
    });
  });

  /*
   * afterEach Method
   *
   * Just like the beforeEach, afterEach is run after Mocha has completed
   * running it's queue.
   */

  afterEach(function(done){
    user.model.remove({}, function(){
      done();
    });
  });

  it('registers a new user', function(done){
    user.register('test2@test.com', 'password', function(doc){
      doc.email.should.eql('test2@test.com');
      done();
    });
  });

  it('fetches user by email', function(done){
    user.findByEmail('test@test.com', function(doc){
      doc.email.should.eql('test@test.com');
      done();
    });
  });
});