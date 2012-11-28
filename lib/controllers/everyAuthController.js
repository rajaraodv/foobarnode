    //Users
    var User;
    var everyauth = require('everyauth');
    var crypto = require('crypto');
    var conf = require(__dirname + '/../../init/conf.js');


    module.exports = function(app, m, service) {
      //store
      var useObj = service.useModel('user');
      User = useObj.User;

      everyauth.debug = false;
      everyauth.twitter.redirectPath('/');
      everyauth.facebook.redirectPath('/');

      everyauth.twitter.consumerKey(conf.twit.consumerKey).consumerSecret(conf.twit.consumerSecret).findOrCreateUser(function(sess, accessToken, accessSecret, twitUser) {
        var promise = this.Promise();
        fetchUserFromMetaData(sess, twitUser, promise, 'twitter');
        return promise;
      });


      everyauth.facebook.appId(conf.fb.appId).appSecret(conf.fb.appSecret).findOrCreateUser(function(session, accessToken, accessTokenExtra, fbUserMetadata) {
        var promise = this.Promise();
        fetchUserFromMetaData(session, fbUserMetadata, promise, 'facebook');
        return promise;
      });

      //read from session
      app.get('/session/user', readUserFromSession);

      app.use(everyauth.middleware(app));
    };

    /*
     Get user from session (used when webpage is refreshed immediately after registration w/ twitter/FB)
     PS: Not guaranteed to be present after server restart.
     */
    function readUserFromSession(req, res) {
      res.send(req.session ? req.session.appUser : {});
    }

    /*
        Create user from Social Network (via SN callback)
     */
    function fetchUserFromMetaData(session, userMetaData, promise, account_type) {
      if(!userMetaData) {
        return promise.reject();
      }
      var post_data = getPostData(userMetaData, account_type);

      User.findByUserNameAndAccessToken(post_data.username, post_data.access_token, function(err, user) {
        if(err) {
          promise.fail(err);
        } else if(user) {
          //store in session (everyauth only stores raw tw/fb user)
          session.appUser = user;
          //fulfill promise
          promise.fulfill(user);
        } else {
          User.create(post_data, function(err, user) {
            if(err) {
              promise.fail(err);
            } else {
              //store in session (everyauth only stores raw tw/fb user)
              session.appUser = user;
              //fulfil promise
              promise.fulfill(user);
            }
          });
        }
      });
    }

    function getPostData(userMetaData, account_type) {
      var name = account_type === 'twitter' ? userMetaData.name : userMetaData.username;
      var photo_url = account_type === 'twitter' ? userMetaData.profile_image_url : 'http://graph.facebook.com/' + userMetaData.username + '/picture';
      return {
        account_type: account_type,
        username: name,
        //Generate access_token (should be same everytime user registers via SN)
        access_token: crypto.createHash('md5').update(name + userMetaData.id + 'secretWordCF').digest('hex'),
        account_id: userMetaData.id,
        photo_url: photo_url
      };
    }