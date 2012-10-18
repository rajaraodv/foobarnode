     var PhotoPost;
     var Like;
     var EmbeddedUser;

     var Step = require('step');

     var mongoose;
     var mongo;
     var ObjectID;
     var BSON;

     module.exports = function(app, m, service) {
         //store
         mongoose = m;
         mongo = m.mongo;
         ObjectID = mongo.ObjectID;
         BSON = mongo.BSONPure;

         PhotoPost = service.useModel("photoPost").PhotoPost; //store
         Like = service.useModel("like").Like; //store
         EmbeddedUser = service.useModel("embeddedUser").EmbeddedUser; //store
         //create
         app.post('/likes', service.validateAndLoadUser, createLike);
         //read
         app.get('/likes/:id', service.validateAndLoadUser, readLike);
         //delete
         app["delete"]('/likes/:id', service.validateAndLoadUser, deleteLike);
         app["delete"]('/likes/photoposts/:photoPostId', service.validateAndLoadUser, deleteLike);
     };

     function createLike(req, res) {
         var b = req.body;
         var post_id = b.post_id;
         var user = req.user;

         var photoPost; //store photoPost of the like
         var http_status; //store the status code
         var like; //store like
         Step(function validateRequiredFields() {
             if(!post_id) {
                 http_status = 400;
                 throw new Error("'post_id' parameter is missing");
             }
             //test for valid post_id
             try {
                 BSON.ObjectID.createFromHexString(post_id); //store
             } catch(e) {
                 http_status = 400;
                 throw new Error('Invalid post_id ' + post_id + ": " + e.message);
             }
             return null;
         }, function findPhotoPost(err) {
             if(err) {
                 throw err;
             }
             PhotoPost.findById(post_id, this);
         }, function handleFindPhotoPost(err, pp) {
             if(err) {
                 throw err;
             } else if(!pp) {
                 http_status = 404; //missing
                 throw new Error('PhotoPost for given post_id ' + post_id + ' does not exist');
             }
             photoPost = pp; //store
             return null;
         }, function checkIfPPAlreadyLiked(err) {
             if(err) {
                 throw err;
             }
             var q = {
                 "post_id": photoPost._id,
                 "creator._id": user._id
             };
             Like.findOne(q).exec(this);
         }, function handleCheckIfPPAlreadyLiked(err, previousLike) {
             if(err) {
                 throw err;
             } else if(previousLike) {
                 http_status = 403;
                 throw new Error("You can 'like' a post only once");
             }
             return null;
         }, function saveLike(err) {
             if(err) {
                 throw err;
             }
             var user = req.user;
             var eUser = new EmbeddedUser({
                 "_id": user._id,
                 "username": user.username,
                 "photo_url": user.photo_url,
                 "first_name": user.first_name
             });
             
             Like.create({
                 creator: eUser,
                 post_id: photoPost._id
             }, this);
         }, function handleSaveLike(err, newLike) {
             if(err) {

                 throw err;
             }
             like = newLike;
             return null;
         }, function addLikeInfo2PhotoPost(err) {
             if(err) {
                 throw err;
             }

             //increment likes_cnt
             photoPost.likes_cnt = photoPost.likes_cnt + 1;

             //update update stamp
             photoPost.updatedAt = new Date();

             photoPost.save(this);
         }, function handleAddLikesInfo2PhotoPost(err) {
             if(err) {
                 throw err;
             }
             return null;
         }, function last(err) {
             if(err) {
                 res.json(http_status || 500, {
                     "Error": err.message
                 });
             } else {
                 res.json(like);
             }
         });
     }

     function readLike(req, res) {
         var id = req.params.id;
         Step(function validateRequiredFields() {
             try {
                 BSON.ObjectID.createFromHexString(id); //store
             } catch(e) {
                 http_status = 400;
                 throw new Error('Invalid post_id ' + id + ": " + e.message);
             }
             return null;
         }, function findL(err) {
             if(err) {
                 throw err;
             }
             Like.findById(id, {
                 '__v': 0
             }).exec(this);
         }, function handleFindL(err, like) {
             if(err) {
                 res.json(400, {
                     "Error": err.message
                 });
             } else if(!like) {
                 res.json(404, {
                     "Error": "Like Not Found"
                 });
             } else {
                 res.json(like);
             }
         });
     }

     function deleteLike(req, res) {
         var id = req.params.id;
         var photoPostId = req.params.photoPostId;
         var user = req.user;
         var http_status;
         var likeObj; //store a ref
         Step(function validateRequiredFields() {
             try {
                 BSON.ObjectID.createFromHexString(photoPostId || id); //store
             } catch(e) {
                 http_status = 400;
                 throw new Error('Invalid Like id or photopost id' + (photoPostId || id) + ": " + e.message);
             }
             return null;
         }, function findL(err) {
             if(err) {
                 throw err;
             }
             if(photoPostId && !id) {//use photoPostId and userid
                 var q = {
                     "post_id": photoPostId,
                     "creator._id": user._id
                 };
                 console.log(q);
                 Like.findOne(q).exec(this);
             } else {
                 Like.findById(id).exec(this);
             }
         }, function handleFindL(err, like) {
             if(err) {
                 throw err;
             } else if(!like) {
                 http_status = 404;
                 throw new Error("Like not found");
             }
             if(like.creator._id.toString() != user._id.toString()) {
                 http_status = 401;
                 throw new Error("You can only update currently authenticated user's like");
             }

             likeObj = like; // store
             return null;
         }, function deleteL(err) {
             if(err) {
                 throw err;
             }
             likeObj.remove(this);
         }, function handleDelL(err) {
             if(err) {
                 throw err;
             }
             return null;
         }, function decrPhotoPostL(err) {
             if(err) {
                 throw err;
             }
             var updateObj = {
                 "updatedAt": new Date(),
                 $inc: {
                     likes_cnt: -1
                 }
             };

             PhotoPost.findOneAndUpdate({
                 _id: likeObj.post_id
             }, updateObj, this);
         }, function handleDecrPhotoPostL(err, updatedPhotoPost) {
             if(err) {
                 throw err;
             } else if(!updatedPhotoPost) {
                 http_status = 500;
                 throw new Error("Could not update PhotoPost");
             }
             return null;
         }, function last(err) {
             if(err) {
                 res.json(http_status || 500, {
                     "Error": err.message
                 });
             } else {
                 res.json({
                     "Status": "OK"
                 });
             }
         });
     }