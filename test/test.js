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
var Like = service.useModel('like').Like;

var user1Props = {
  account_type: "facebook",
  username: "user1",
  first_name: "user1_firstName",
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
  "_id": "tempId",
  "username": "user1",
  "photo_url": "http://path/to/facebook/pic.jpg",
  "first_name": "user1_firstname"
});

var eUser2 = new EmbeddedUser({
  "_id": "tempId",
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
  photo_caption: photo_caption1,
  _id: "tempId"
};

var comment1Props = {
  text: "text of comment 1",
  creator: eUser1,
  post_id: photoPost1Props._id
};

var comment2Props = {
  text: "text of comment 2",
  creator: eUser1,
  post_id: "tempId"
};

var like1Props = {
  creator: eUser1,
  post_id: "tempId"
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
    step(function removeAllUsers() {
      User.remove({}, this);
    }, function createUser1(err) {
      User.create(user1Props, this);
    }, function handleCreateUser1(err, u) {
      user1 = u;
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

  it('should properly update user (user1 from beforeEach)', function(done) {
    User.update(user1._id, {
      "first_name": "new_first_name",
      "last_name": "new_last_name"
    }, function(err, updatedUser) {
      expect(updatedUser.first_name).to.equal('new_first_name');
      expect(updatedUser.last_name).to.equal('new_last_name');
      done();
    });
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


describe('Comments', function() {
  var comment1 = null;
  var user1 = null;
  var photoPost1 = null;

  beforeEach(function(done) {
    step(function removeAllUsers() {
      User.remove({}, this);
    }, function createUser1() {
      User.create(user1Props, this);
    }, function createPhotoPost1(err, u1) {
      if(err) throw err;

      user1 = u1;
      photoPost1Props["creator"]["_id"] = user1._id;
      PhotoPost.create(photoPost1Props, this);
    }, function createComment1(err, pp1) {
      if(err) throw err;

      photoPost1 = pp1;
      comment1Props["creator"]["_id"] = user1._id;
      comment1Props["post_id"] = pp1._id;
      Comment.create(comment1Props, this);
    }, function last(err, newComment) {
      comment1 = newComment;
      should.not.exist(err);
      done();
    });
  });

  it('Should create User, PhotoPost, & Comment in BeforeEach', function(done) {
    should.exist(user1);
    should.exist(photoPost1);
    should.exist(comment1);
    expect(comment1.creator._id).to.equal(user1._id);
    expect(comment1.post_id).to.equal(photoPost1._id);
    expect(comment1.text).to.equal("text of comment 1");
    done();
  });

  afterEach(function(done) {
    user1.remove(function(err) {
      should.not.exist(err);
      photoPost1.remove(function(err) {
        should.not.exist(err);
        comment1.remove(function(err) {
          should.not.exist(err);
          done();
        });
      });
    });
  });

});

describe('Likes', function() {
  var like1 = null; //user1 liking pp1
  var like2 = null; //user1 liking pp2
  var user1 = null;
  var photoPost1 = null;
  var photoPost2 = null;

  beforeEach(function(done) {
    step(function removeAllUsers() {
      User.remove({}, this);
    }, function createUser1() {
      User.create(user1Props, this);
    }, function createPhotoPost1(err, u1) {
      if(err) throw err;

      user1 = u1;
      photoPost1Props["creator"]["_id"] = user1._id;
      PhotoPost.create(photoPost1Props, this);
    }, function createPhotoPost2(err, pp1) {
      if(err) throw err;

      photoPost1 = pp1;

      //photopost2
      photoPost2Props["creator"]["_id"] = user1._id;
      PhotoPost.create(photoPost2Props, this);
    }, function createLike1(err, pp2) {
      if(err) throw err;

      photoPost2 = pp2;
      //like1 =  user1 liking photoPost1
      like1Props["creator"]["_id"] = user1._id;
      like1Props["post_id"] = photoPost1._id;
      Like.create(like1Props, this);
    }, function createLike2(err, newLike) {
      if(err) throw err;

      like1 = newLike;

      //like2 = user1 liking photoPost2
      like1Props["creator"]["_id"] = user1._id;
      like1Props["post_id"] = photoPost2._id;
      Like.create(like1Props, this);
    }, function last(err, newLike) {
      like2 = newLike;
      should.not.exist(err);
      done();
    });
  });

  it('Test setup for "Like" in BeforeEach', function(done) {
    should.exist(user1);
    should.exist(photoPost1);
    should.exist(like1);
    should.exist(like2);
    expect(like1.creator._id).to.equal(user1._id);
    expect(like1.post_id).to.equal(photoPost1._id);

    //like2 = user1 liking pp2
    expect(like2.creator._id).to.equal(user1._id);
    expect(like2.post_id).to.equal(photoPost2._id);
    done();
  });

  it('Test updating creator', function(done) {
    var props = {
      "first_name": "new_first_name",
      "username": "new_username",
      "photo_url": "newPhotoUrl"
    };
    var emObj = EmbeddedUser.getEmbeddableObjToUpdate(props);

    Like.updateCreator(user1._id, emObj, function(err, count) {
      expect(count).to.equal(2);
      done();
    });

  });

  afterEach(function(done) {
    user1.remove(function(err) {
      should.not.exist(err);
      photoPost1.remove(function(err) {
        should.not.exist(err);
        like1.remove(function(err) {
          should.not.exist(err);
          done();
        });
      });
    });
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
    }, function handleCreatePhotoPost2(err, pp2) {
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


describe('Test /users', function() {
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

  it('Test unauthorized GET /users', function(done) {
    request(app).get('/users/123').set('Accept', 'application/json').end(function(err, response) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });

  it('Test valid GET /users', function(done) {
    request(app).get('/users/me').set('X-foobar-username', user1.username).set('X-foobar-access-token', user1.access_token).end(function(err, response) {
      expect(response.statusCode).to.equal(200);
      expect(response.body.username).to.equal('user1');
      done();
    });
  });

  it('Test update /users/me properly updates the user', function(done) {
    request(app).put('/users/me').set('X-foobar-username', user1.username).set('X-foobar-access-token', user1.access_token).send({
      "first_name": "bla_first_name"
    }).end(function(err, response) {
      expect(response.statusCode).to.equal(200);
      expect(response.body.first_name).to.equal('bla_first_name');
      done();
    });
  });
});

describe('Update User: Test Updating user also user info on all photoposts & comments', function() {
  var photoPost1 = null;
  var photoPost2 = null;
  var user1 = null;
  var comment1 = null;
  var comment2 = null;
  var like1 = null;
  var like2 = null;

  beforeEach(function(done) {
    step(function removeAllUsers() {
      User.remove({}, this);
    }, function createUser1() {
      User.create(user1Props, this);
    }, function createPhotoPost1(err, u1) {
      if(err) throw err;

      user1 = u1;
      photoPost1Props["creator"]["_id"] = user1._id;
      PhotoPost.create(photoPost1Props, this);
    }, function createPhotoPost2(err, pp1) {
      if(err) throw err;

      photoPost1 = pp1;
      photoPost2Props["creator"]["_id"] = user1._id;
      PhotoPost.create(photoPost2Props, this);
    }, function createComment1(err, pp2) {
      if(err) throw err;

      photoPost2 = pp2;

      comment1Props["creator"]["_id"] = user1._id;
      comment1Props["post_id"] = photoPost1._id;
      Comment.create(comment1Props, this);
    }, function createComment2(err, c1) {
      comment1 = c1;
      comment2Props["creator"]["_id"] = user1._id;
      comment2Props["post_id"] = photoPost2._id;
      Comment.create(comment2Props, this);
    }, function createLike1(err, c2) {
      comment2 = c2;

      like1Props["creator"]["_id"] = user1._id;
      like1Props["post_id"] = photoPost1._id;
      Like.create(like1Props, this);
    }, function createLike2(err, newLike) {
      like1 = newLike;

      like1Props["creator"]["_id"] = user1._id;
      like1Props["post_id"] = photoPost2._id;
      Like.create(like1Props, this);
    }, function last(err, newLike) {
      like2 = newLike;

      should.not.exist(err);
      done();
    });
  });

  afterEach(function(done) {
    user1.remove(function(err) {
      should.not.exist(err);
      photoPost1.remove(function(err) {
        should.not.exist(err);

        photoPost2.remove(function(err) {
          should.not.exist(err);

          comment1.remove(function(err) {
            should.not.exist(err);

            comment2.remove(function(err) {
              should.not.exist(err);

              like1.remove(function(err) {
                should.not.exist(err);

                like2.remove(function(err) {
                  should.not.exist(err);

                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  it('Test update user setup', function(done) {
    should.exist(user1);
    should.exist(photoPost1);
    should.exist(photoPost2);
    should.exist(comment1);
    should.exist(comment2);
    expect(photoPost1.creator._id).to.equal(user1._id);
    done();
  });

  it('Test updating user also updates all "photoPosts"', function(done) {
    request(app).put('/users/me').set('X-foobar-username', user1.username).set('X-foobar-access-token', user1.access_token).send({
      "first_name": "bla_first_name"
    }).end(function(err, response) {
      expect(response.statusCode).to.equal(200);
      expect(response.body.first_name).to.equal('bla_first_name');
      PhotoPost.find({
        "creator._id": user1._id
      }, function(err, docs) {
        docs.length.should.eql(2);
        var pp1 = docs[0];
        var pp2 = docs[1];
        expect(pp1.creator.first_name).to.equal('bla_first_name');
        expect(pp2.creator.first_name).to.equal('bla_first_name');
        done();
      });
    });
  });


  it('Test updating user also updates all "Comments"', function(done) {
    request(app).put('/users/me').set('X-foobar-username', user1.username).set('X-foobar-access-token', user1.access_token).send({
      "first_name": "bla_first_name"
    }).end(function(err, response) {
      expect(response.statusCode).to.equal(200);
      expect(response.body.first_name).to.equal('bla_first_name');
      Comment.find({
        "creator._id": user1._id
      }, function(err, docs) {
        docs.length.should.eql(2);
        var c1 = docs[0];
        var c2 = docs[1];
        expect(c1.creator.first_name).to.equal('bla_first_name');
        expect(c2.creator.first_name).to.equal('bla_first_name');
        done();
      });
    });
  });

  it('Test updating user also updates all "Likes"', function(done) {
    request(app).put('/users/me').set('X-foobar-username', user1.username).set('X-foobar-access-token', user1.access_token).send({
      "first_name": "bla_first_name"
    }).end(function(err, response) {
      expect(response.statusCode).to.equal(200);
      expect(response.body.first_name).to.equal('bla_first_name');
      Like.find({
        "creator._id": user1._id
      }, function(err, docs) {
        docs.length.should.eql(2);
        var l1 = docs[0];
        var l2 = docs[1];
        expect(l1.creator.first_name).to.equal('bla_first_name');
        expect(l2.creator.first_name).to.equal('bla_first_name');
        done();
      });
    });
  });

});