var request = require('supertest');
var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();
var step = require('step');
var appModule = require('../app'),
 app = appModule.app,
  mongoose = appModule.mongoose;

// Connecting to a local test database or creating it on the fly
mongoose.connect('mongodb://localhost/user_test');

var service = require('./../init/service');
service.init(mongoose);

var simpleTimestamps = require('./../lib/utils/simpleTimestamps').SimpleTimestamps;

var User = service.useModel('user').User;
var EmbeddedUser = service.useModel('embeddedUser').EmbeddedUser;
var PhotoPost = service.useModel('photoPost').PhotoPost;
var Photo = service.useModel('photo').Photo;
var Comment = service.useModel('comment').Comment;




var user1Props = {
  account_type: "facebook",
  username: "user1",
  first_name: "user1_firsname",
  last_name: "user1_lastName",
  access_token: "a123",
  photo_url: "http://path/to/facebook/pic.jpg",
  email: "user1@test.com"
};

var user2Props = {
  account_type: "twitter",
  username: "user2",
  first_name: "user2_firstname",
  last_name: "user2_lastname",
  access_token: "a123",
  photo_url: "http://path/to/twitter/pic.jpg",
  email: "user2@test.com"
};

var eUser1 = new EmbeddedUser({
  "_id": "a123",
  "username": "user1",
  "photo_url": "http://path/to/facebook/pic.jpg",
  "first_name": "user1_firstname"
});

var eUser2 = new EmbeddedUser({
  "_id": "eUser2Id",
  "username": "user2",
  "photo_url": "http://path/to/facebook/pic.jpg",
  "first_name": "user2_firstname"
});

var photo1 = new Photo({
  _id: "photo1id",
  url: "/photos/photoid",
  filename: "photo1.jpg",
  width: "50px",
  height: "50px"
});

var photo2 = new Photo({
  _id: "photo2id",
  url: "/photos/photoid",
  filename: "photo2.jpg",
  width: "50px",
  height: "50px"
});


var product_id1 = "1";
var photo_caption1 = "this is photo caption 1";

var product_id2 = "2";
var photo_caption2 = "this is photo caption 2";

var photoPost1Props = {
  creator: eUser1,
  photo: photo1,
  product_id: product_id1,
  photo_caption: photo_caption1
};

var photoPost2Props = {
  creator: eUser2,
  photo: photo2,
  product_id: product_id2,
  photo_caption: photo_caption2
};

describe('Users', function() {
  var user1 = null;
  var user2 = null;

  beforeEach(function(done) {
    User.create(user1Props, function(err, user) {
      user1 = user;
      done();
    });
  });

  afterEach(function(done) {
    user1.remove(function(err) {
      should.not.exist(err);
      done();
    });
  });

  it('Test user1 is created in beforeEach', function(done) {
    user1.email.should.eql('user1@test.com');
    done();
  });

  it('Find by username and access_token', function(done) {
    User.findByUserNameAndAccessToken(user1.username, user1.access_token, function(err, userFromDB) {
      should.not.exist(err);
      should.exist(userFromDB);
      userFromDB.email.should.eql('user1@test.com');
      done();
    });
  });
});

describe('EmbeddedUser', function() {
  it('EmbeddedUser.getEmbeddableObjToUpdate should create proper embeddable user', function(done) {
    var props = {
      "first_name": "new_first_name",
      "username": "new_username",
      "photo_url": "newPhotoUrl"
    };
    var obj = EmbeddedUser.getEmbeddableObjToUpdate(props);
    should.exist(obj);
    expect(obj['creator.first_name']).to.equal('new_first_name');
    expect(obj['creator.username']).to.equal('new_username');
    expect(obj['creator.photo_url']).to.equal('newPhotoUrl');
    done();
  });

});

describe('PhotoPosts', function() {
  var photoPost1 = null;
  var photoPost2 = null;
  var user1 = null;

  beforeEach(function(done) {
    step(function createUser1() {
      User.create(user1Props, this);
    }, function createPhotoPost1(err, u1) {
      if(err) throw err;

      user1 = u1;
      should.exist(user1);
      photoPost1Props["creator"]["_id"] = user1._id;
      PhotoPost.create(photoPost1Props, this);
    }, function createPhotoPost2(err, pp1) {
      if(err) throw err;

      photoPost1 = pp1;
      pp1.creator._id.should.eql(user1._id);
      photoPost2Props["creator"]["_id"] = user1._id;
      PhotoPost.create(photoPost2Props, this);
    }, function handleCreatePhotoPost(err, pp2) {
      if(err) throw err;

      photoPost2 = pp2;
      pp2.creator._id.should.eql(user1._id);
      PhotoPost.count({
        "creator._id": user1._id
      }, this);
    }, function last(err, count) {
      count.should.eql(2);
      done();
    });
  });

  afterEach(function(done) {
    user1.remove(function(err) {
      should.not.exist(err);
      photoPost1.remove(function(err) {
        photoPost2.remove(function(err) {
          done();
        });
      });
    });
  });

  it('Test PhotoPost1 was created in beforeEach', function(done) {
    photoPost1.product_id.should.eql('1');
    done();
  });

  it('Test updating creator', function(done) {
    var props = {
      "first_name": "new_first_name",
      "username": "new_username",
      "photo_url": "newPhotoUrl"
    };
    var emObj = EmbeddedUser.getEmbeddableObjToUpdate(props);

    PhotoPost.updateCreator(user1._id, emObj, function(err, count) {
      expect(count).to.equal(2);
      done();
    });

  });

  it('-ve Test updating creator', function(done) {
    var props = {};
    var emObj = EmbeddedUser.getEmbeddableObjToUpdate(props);
    PhotoPost.updateCreator(user1._id, emObj, function(err, count) {
      should.exist(err);
      should.not.exist(count);
      done();
    });
  });
});


describe('GET /users/123', function(){
  it('respond with json', function(done){
    request(app)
      .get('/users/123')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});




