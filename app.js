    /* server */
    var express = require("express");
    var app = express();
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var mongo = mongoose.mongo;
    var GridStore = mongo.GridStore;
    var ObjectID = mongo.ObjectID;
    var BSON = mongo.BSONPure;
    var SimpleTimestamps = require("./lib/simpleTimestamps").SimpleTimestamps;
    var fs = require('fs');
    var im = require('imagemagick');
    var Step = require('step');

    app.configure(function() {
        app.use(express.bodyParser({
            uploadDir: __dirname + '/public/uploads'
        }));
        app.use(express.methodOverride());
        app.use(express.static(__dirname + '/public'));
        app.use(finalReqErrorHandler);
    });

    function finalReqErrorHandler(err, req, res, next) {
        res.json(err.status, {
            "Error": err.message + ". Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
        });
    }

    //test end
    app.get('/', function(req, res) {
        Person.find({}, function(error, data) {
            res.json(data);
        });
    });

    //Users
    //create
    app.post('/users', validateAndLoadUser, createUser);
    //read
    app.get('/users/:id', validateAndLoadUser, readUser);
    //update
    app.put('/users/:id', validateAndLoadUser, updateUser);
    //delete
    app.delete('/users/:id', validateAndLoadUser, deleteUser);

    //PhotoPosts
    //create
    app.post('/photoposts', validateAndLoadUser, createPhotoPost);
    //read
    app.get('/photoposts/:id', validateAndLoadUser, readPhotoPost);
    //update
    app.put('/photoposts/:id', validateAndLoadUser, updatePhotoPost);
    //delete
    app.delete('/photoposts/:id', validateAndLoadUser, deletePhotoPost);

    //Photos - returns raw photo image
    app.get('/photos/:id', readPhoto);

    //Comments
    //create
    app.post('/comments', validateAndLoadUser, createComment);
    //read
    app.get('/comments/:id', validateAndLoadUser, readComment);
    //update
    app.put('/comments/:id', validateAndLoadUser, updateComment);
    //delete
    app.delete('/comments/:id', validateAndLoadUser, deleteComment);

    //Likes
    //create
    app.post('/likes', validateAndLoadUser, createLike);
    //read
    app.get('/likes/:id', validateAndLoadUser, readLike);
    //delete
    app.delete('/likes/:id', validateAndLoadUser, deleteLike);

    //feeds
    app.get('/feeds/:page/:limit', validateAndLoadUser, readFeeds);


    /* models */
    mongoose.connect('mongodb://127.0.0.1/sampledb');

    var Schema = mongoose.Schema;
    var Hobby = new Schema({
        name: {
            type: String,
            required: true,
            trim: true
        }
    });

    var accountTypes = ['facebook', 'twitter'];
    var UserSchema = new Schema({
        account_type: {
            type: String,
            enum: accountTypes,
            required: true
        },
        username: {
            type: String,
            required: true
        },

        first_name: String,
        last_name: String,
        access_token: {
            type: String,
            required: true
        },
        account_id: String,
        photo_url: {
            type: String,
            required: true
        },
        email: String
    });

    UserSchema.plugin(SimpleTimestamps);
    var User = mongoose.model('User', UserSchema);

    //Simplified user schema for embedding in other objects like PhotoSchema
    var EmbeddedUserSchema = new Schema({
        username: String,
        _id: Schema.Types.ObjectId,
        photo_url: String
    });
    var EmbeddedUser = mongoose.model('EmbeddedUser', EmbeddedUserSchema);

    var CommentSchema = new Schema({
        creator: {
            type: EmbeddedUserSchema.tree,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        post_id: {
            type: Schema.Types.ObjectId,
            required: true
        }
    });
    CommentSchema.plugin(SimpleTimestamps);
    var Comment = mongoose.model('Comment', CommentSchema);

    var LikeSchema = new Schema({
        creator: {
            type: EmbeddedUserSchema.tree,
            required: true
        },
        post_id: {
            type: Schema.Types.ObjectId,
            required: true
        }
    });
    LikeSchema.plugin(SimpleTimestamps);
    var Like = mongoose.model('Like', LikeSchema);


    var PhotoSchema = new Schema({
        url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        },
        width: String,
        height: String
    });

    var Photo = mongoose.model('Photo', PhotoSchema);

    var PhotoPostSchema = new Schema({
        creator: {
            type: EmbeddedUserSchema.tree,
            required: true
        },
        photo: {
            type: PhotoSchema.tree,
            required: true
        },
        photo_caption: {
            type: String,
        default:
            ""
        },
        likes_cnt: {
            type: Number,
        default:
            0
        },
        comments_cnt: {
            type: Number,
        default:
            0
        },
        // liked_by: [EmbeddedUserSchema],
        comments: [{
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }]
    });

    PhotoPostSchema.plugin(SimpleTimestamps);
    var PhotoPost = mongoose.model('PhotoPost', PhotoPostSchema);

    function createLike(req, res) {
        var b = req.body;
        var post_id = b.post_id;
        var user = req.user;

        var photoPost; //store photoPost of the comment
        var http_status; //store the status code
        var like; //store like
        Step(function validateRequiredFields() {
            if (!post_id) {
                http_status = 400;
                throw new Error("'post_id' parameter is missing");
            }
            //test for valid post_id            
            try {
                BSON.ObjectID.createFromHexString(post_id); //store
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + post_id + ": " + e.message);
            }
            return null;
        }, function findPhotoPost(err) {
            if (err) {
                throw err;
            }
            PhotoPost.findById(post_id, this);
        }, function handleFindPhotoPost(err, pp) {
            if (err) {
                throw err;
            } else if (!pp) {
                http_status = 404; //missing
                throw new Error('PhotoPost for given post_id ' + post_id + ' does not exist');
            }
            photoPost = pp; //store
            return null;
        }, function checkIfPPAlreadyLiked(err) {
            if (err) {
                throw err;
            }
            var q = {
                "post_id": photoPost._id,
                "creator._id": user._id
            };
            Like.findOne(q).exec(this);
        }, function handleCheckIfPPAlreadyLiked(err, previousLike) {
            if (err) {
                throw err;
            } else if (previousLike) {
                http_status = 403;
                throw new Error("You can 'like' a post only once");
            }
            return null;
        }, function saveLike(err) {
            if (err) {
                throw err;
            }
            var user = req.user;
            var eUser = new EmbeddedUser({
                "_id": user._id,
                "username": user.username,
                "photo_url": user.photo_url
            });
            like = new Like({
                creator: eUser,
                post_id: photoPost._id
            });
            like.save(this);
        }, function handleSaveLike(err) {
            if (err) {

                throw err;
            }
            return null;
        }, function addLikeInfo2PhotoPost(err) {
            if (err) {
                throw err;
            }

            //increment likes_cnt
            photoPost.likes_cnt = photoPost.likes_cnt + 1;

            //update update stamp
            photoPost.updatedAt = new Date();

            photoPost.save(this);
        }, function handleAddLikesInfo2PhotoPost(err) {
            if (err) {
                throw err;
            }
            return null;
        }, function last(err) {
            if (err) {
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
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findL(err) {
            if (err) {
                throw err;
            }
            Like.findById(id, {
                '__v': 0
            }).exec(this);
        }, function handleFindL(err, like) {
            if (err) {
                res.json(400, {
                    "Error": err.message
                });
            } else if (!like) {
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
        var user = req.user;
        var http_status;
        var likeObj; //store a ref
        Step(function validateRequiredFields() {
            try {
                BSON.ObjectID.createFromHexString(id); //store
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findL(err) {
            if (err) {
                throw err;
            }
            Like.findById(id).exec(this);
        }, function handleFindL(err, like) {
            if (err) {
                throw err;
            } else if (!like) {
                http_status = 404;
                throw new Error("Like not found");
            }
            if (like.creator._id.toString() != user._id.toString()) {
                http_status = 401;
                throw new Error("You can only update currently authenticated user's comment");
            }

            likeObj = like; // store
            return null;
        }, function deleteL(err) {
            if (err) {
                throw err;
            }
            likeObj.remove(this);
        }, function handleDelL(err) {
            if (err) {
                throw err;
            }
            return null;
        }, function decrPhotoPostL(err) {
            if (err) {
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
            if (err) {
                throw err;
            } else if (!updatedPhotoPost) {
                http_status = 500;
                throw new Error("Could not update PhotoPost");
            }
            return null;
        }, function last(err) {
            if (err) {
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

    function createComment(req, res) {
        var b = req.body;
        var post_id = b.post_id;
        var text = b.text;

        var photoPost; //store photoPost of the comment
        var http_status; //store the status code
        var comment; //store comment
        Step(function validateRequiredFields() {
            if (!post_id || !text) {
                http_status = 400;
                throw new Error("Either 'post_id' or 'text' parameter is missing");
            }
            //test for valid post_id            
            try {
                BSON.ObjectID.createFromHexString(post_id); //store
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + post_id + ": " + e.message);
            }
            return null;
        }, function findPhotoPost(err) {
            if (err) {
                throw err;
            }
            PhotoPost.findById(post_id, this);
        }, function handleFindPhotoPost(err, pp) {
            if (err) {
                throw err;
            } else if (!pp) {
                http_status = 404; //missing
                throw new Error('PhotoPost for given post_id ' + post_id + ' does not exist');
            }
            photoPost = pp; //store
            return null;
        }, function saveComment(err) {
            if (err) {
                throw err;
            }
            var user = req.user;
            var eUser = new EmbeddedUser({
                "_id": user._id,
                "username": user.username,
                "photo_url": user.photo_url
            });
            comment = new Comment({
                creator: eUser,
                text: text,
                post_id: photoPost._id
            });
            comment.save(this);
        }, function handleSaveComment(err) {
            if (err) {

                throw err;
            }
            return null;
        }, function addCommentInfo2PhotoPost(err) {
            if (err) {
                throw err;
            }
            //push new comment
            photoPost.comments.push(comment);

            //increment comments_cnt
            photoPost.comments_cnt = photoPost.comments_cnt + 1;

            //update update stamp
            photoPost.updatedAt = new Date();

            photoPost.save(this);
        }, function handleAddCommentInfo2PhotoPost(err) {
            if (err) {
                throw err;
            }
            return null;
        }, function last(err) {
            if (err) {
                res.json(http_status || 500, {
                    "Error": err.message
                });
            } else {
                res.json(comment);
            }
        });
    }

    function readComment(req, res) {
        var id = req.params.id;
        Step(function validateRequiredFields() {
            try {
                BSON.ObjectID.createFromHexString(id); //store
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findComment(err) {
            if (err) {
                throw err;
            }
            Comment.findById(id, {
                '__v': 0
            }).exec(this);
        }, function handleFindComment(err, comment) {
            if (err) {
                res.json(400, {
                    "Error": err.message
                });
            } else if (!comment) {
                res.json(404, {
                    "Error": "Comment Not Found"
                });
            } else {
                res.json(comment);
            }
        });
    }

    function updateComment(req, res) {
        var id = req.params.id;
        var text = req.body.text;
        var user = req.user;
        var http_status;
        var updatedComment;
        Step(function validateRequiredFields() {
            if (!text || text.replace(/^\s*|\s*$/g, '') == "") {
                http_status = 400;
                throw new Error('Comment text cannot be empty or is missing');
            }
            try {
                BSON.ObjectID.createFromHexString(id); //store
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findComment(err) {
            if (err) {
                throw err;
            }
            Comment.findById(id).exec(this);
        }, function handleFindComment(err, comment) {
            if (err) {
                throw err;
            } else if (!comment) {
                http_status = 404;
                throw new Error("Comment not found");
            }
            if (comment.creator._id.toString() != user._id.toString()) {
                http_status = 401;
                throw new Error("You can only update currently authenticated user's comment");
            }

            updatedComment = comment; // store
            comment.text = text;
            comment.updatedAt = new Date();
            comment.save(this);
        }, function updatePPTimeStamp(err) {
            if (err) {
                throw err;
            }
            var updateObj = {
                "updatedAt": new Date()
            };

            PhotoPost.findOneAndUpdate({
                _id: updatedComment.post_id
            }, updateObj, this);
        }, function HandleUpdatePPTimeStamp(err, updatedPhotoPost) {
            if (err) {
                throw err;
            } else if (!updatedPhotoPost) {
                http_status = 500;
                throw new Error("Could not update PhotoPost");
            }
            return null;
        }, function last(err) {
            if (err) {
                res.json(http_status || 500, {
                    "Error": err.message
                });
            } else if (!updatedComment) {
                res.json(404, {
                    "Error": "Comment Not Found"
                });
            } else {
                res.json(updatedComment);
            }
        });
    }

    function deleteComment(req, res) {
        var id = req.params.id;
        var user = req.user;
        var http_status;
        var commentObj; //store a ref
        Step(function validateRequiredFields() {
            try {
                BSON.ObjectID.createFromHexString(id); //store
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findComment(err) {
            if (err) {
                throw err;
            }
            Comment.findById(id).exec(this);
        }, function handleFindComment(err, comment) {
            if (err) {
                throw err;
            } else if (!comment) {
                http_status = 404;
                throw new Error("Comment not found");
            }
            if (comment.creator._id.toString() != user._id.toString()) {
                http_status = 401;
                throw new Error("You can only delete currently authenticated user's comment");
            }

            commentObj = comment; // store
            return null;
        }, function deleteC(err) {
            if (err) {
                throw err;
            }
            commentObj.remove(this);
        }, function handleDelC(err) {
            if (err) {
                throw err;
            }
            return null;
        }, function decrPhotoPostComment(err) {
            if (err) {
                throw err;
            }
            var updateObj = {
                "updatedAt": new Date(),
                $inc: {
                    comments_cnt: -1
                }
            };

            PhotoPost.findOneAndUpdate({
                _id: commentObj.post_id
            }, updateObj, this);
        }, function handleDecrPhotoPostComment(err, updatedPhotoPost) {
            if (err) {
                throw err;
            } else if (!updatedPhotoPost) {
                http_status = 500;
                throw new Error("Could not update PhotoPost");
            }
            return null;
        }, function last(err) {
            if (err) {
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

    function createPhotoPost(req, res) {
        var filePath;
        var fileName;
        try {
            filePath = req.files.pic.path;
            fileName = req.files.pic.name;
        } catch (e) {}
        if (!fileName || fileName == "") {
            return res.json(400, {
                "Photo Not Found": "Either image was not provided or uploaded. Tip - Make sure upload form's field name 'pic' "
            });
        }

        var fileMetaData; //saved after ImageMagick is done
        var savedPhotoPost; //stored when it is created for further useage
        Step(function getPhotoMetaData() {
            //Note: ImageMagick by default processes w/ -verbose tag. but that has a bug & 
            //throws JS error for some images. So pass filePath as an array to not use -verbose flag
            //In this case, we get raw output w/ 3rd word being widthxheight info
            im.identify([filePath], this);
        }, function handleGetPhotoMetaData(err, rawMetaData) {
            if (err) {
                throw err;
            }
            var width;
            var height;
            try {
                //get 3rd word and split it
                var tmp = rawMetaData.split(" ")[2].split(/x/);
                width = parseInt(tmp[0]);
                height = parseInt(tmp[1]);
            } catch (e) {

            }
            return {
                width: width,
                height: height
            };
        }, function saveToGridFS(err, fMetaData) {
            if (err) {
                throw err;
            }
            fileMetaData = fMetaData; //save
            var gridStoreWrite = new GridStore(mongoose.connection.db, new ObjectID(), fileName, "w");
            gridStoreWrite.writeFile(filePath, this);
        }, function handleSaveToGridFSfunction(err, photoObject) {
            if (err) {
                throw err;
            }

            var user = req.user;
            var eUser = new EmbeddedUser({
                "_id": user._id,
                "username": user.username,
                "photo_url": user.photo_url
            });

            var photo = new Photo({
                _id: photoObject._id,
                url: "/photos/" + photoObject._id,
                filename: photoObject.filename,
                width: fileMetaData.width,
                height: fileMetaData.height

            });
            var photoPost = new PhotoPost({
                creator: eUser,
                photo: photo
            });
            return photoPost;
        }, function savePhotoPost(err, photoPost) {
            if (err) {
                throw err;
            } /* save for further usage */
            savedPhotoPost = photoPost;
            photoPost.save(this);
        }, function handleSavePhotoPost(err) {
            if (err) {
                throw err;
            }
            return null; //must return something
        }, function last(err) {
            if (err) {
                res.json(500, err);
            } else {
                res.json(savedPhotoPost);
                deleteFile(filePath);
            }
        });

    }

    function readPhotoPost(req, res) {
        var id = req.params.id;
        //Construct ObjectID from 'id' string
        try {
            var o_id = BSON.ObjectID.createFromHexString(id);
        } catch (e) {
            res.json(500, {
                "Error": id + " id - " + e.message
            });
            return;
        }

        PhotoPost.findById(id, {
            'createdAt': 0,
            '__v': 0
        }).populate('comments', {
            'post_id': 0,
            'createdAt': 0,
            '__v': 0
        }, null).exec(function(err, photoPost) {
            if (err) {
                res.json(500, err);
            } else if (!photoPost) {
                res.json(404, {
                    "Error": "PhotoPost Not Found"
                });
            } else {
                res.json(photoPost);
            }
        });
    }

    function updatePhotoPost(req, res) {
        var id = req.params.id;
        var user = req.user;
        var photo_caption = req.body.photo_caption;
        var http_status;
        var photoPostRef;
        Step(function validateRequiredFields() {
            if (!photo_caption || photo_caption.replace(/^\s*|\s*$/g, '') == "") {
                http_status = 400;
                throw new Error('photo_caption text is missing and/or is empty');
            }
            try {
                BSON.ObjectID.createFromHexString(id); //store
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid PhotoPost id ' + id + ": " + e.message);
            }
            return null;
        }, function findPP(err) {
            if (err) {
                throw err;
            }
            PhotoPost.findById(id).exec(this);
        }, function handleFindPP(err, photoPost) {
            if (err) {
                throw err;
            } else if (!photoPost) {
                http_status = 404;
                throw new Error("PhotoPost not found");
            }
            if (photoPost.creator._id.toString() != user._id.toString()) {
                http_status = 401;
                throw new Error("You can only update currently authenticated user's PhotoPost");
            }
            return photoPost;
        }, function addCaption2PP(err, photoPost) {
            if (err) {
                throw err;
            }
            photoPostRef = photoPost; //store
            photoPost.photo_caption = photo_caption;
            photoPost.updatedAt = new Date();
            photoPost.save(this);
        }, function handleAddCaption2PP(err) {
            if (err) {
                throw new Error("Could not update PhotoPost - " + err.message);
            }
            return null;
        }, function last(err) {
            if (err) {
                res.json(http_status || 500, {
                    "Error": err.message
                });
            } else {
                res.json(photoPostRef);
            }
        });
    }

    function deletePhotoPost(req, res) {
        var id = req.params.id;
        var user = req.user;
        var http_status;
        var photoPostObjectId; //store ObjectId of id String
        var photoPostObj; //store a ref
        Step(function validateRequiredFields() {
            try {
                photoPostObjectId = BSON.ObjectID.createFromHexString(id); //store
            } catch (e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findPhotoPost(err) {
            if (err) {
                throw err;
            }
            PhotoPost.findById(id).exec(this);
        }, function handleFindPhotoPost(err, photoPost) {
            if (err) {
                throw err;
            } else if (!photoPost) {
                http_status = 404;
                throw new Error("PhotoPost not found");
            }
            if (photoPost.creator._id.toString() != user._id.toString()) {
                http_status = 401;
                throw new Error("You can only delete currently authenticated user's PhotoPost");
            }

            photoPostObj = photoPost; // store
            return null;
        }, function deletePP(err) {
            if (err) {
                throw err;
            }
            photoPostObj.remove(this);
        }, function handleDelPP(err) {
            if (err) {
                throw err;
            }
            return null;
        }, function deletePPComments(err) {
            if (err) {
                throw err;
            }
            Comment.where('post_id').equals(photoPostObjectId).remove(this);
        }, function deletePPLikes(err) {
            if (err) {
                throw err;
            }
            Like.where('post_id').equals(photoPostObjectId).remove(this);
        }, function openGridStoreToDelPhoto(err) {
            if (err) {
                throw err;
            }
            var gridStore = new GridStore(mongoose.connection.db, photoPostObj.photo._id, "r");
            gridStore.open(this);
        }, function handleOpenGridStoreToDelPhoto(err, gridStore) {
            if (err) {
                throw err;
            }
            gridStore.unlink(this); //delete photo
        }, function last(err) {
            if (err) {
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

   function readFeeds(req, res) {
        var limit = req.params.limit || 10;
        var page = req.params.page || 1;
        var totalItemsToSkip = (page * limit) - limit; //used when idOfLastItemOfCurrentPage not sent
        var populateConstraints = {
            'post_id': 0,
            'createdAt': 0,
            '__v': 0
        };

        var ppConstraints = {
            "__v": 0
        };

        var sortConstraints = {
            sort: {
                "updatedAt": -1
            }
        };
        var mainQuery = {};

        PhotoPost.find(mainQuery, ppConstraints, sortConstraints).skip(totalItemsToSkip).limit(limit).populate('comments', populateConstraints, null).exec(function(err, results) {
            if (err) {
               res.json(500, "Could not get PhotoPosts - " + err.message);
            } else {
                res.json(results);
            }
        });
    }

    function readPhoto(req, res) {
        var id = req.params.id;
        //Construct ObjectID from 'id' string
        try {
            var o_id = BSON.ObjectID.createFromHexString(id);
        } catch (e) {
            res.json(500, {
                "Error": id + " id - " + e.message
            });
            return;
        }

        //Create GridStore in READ mode
        var gridStore = new GridStore(mongoose.connection.db, o_id, "r");
        gridStore.open(function(err, gridStore) {
            if (err) {
                res.json(404, {
                    "Error": err.message
                });
                return;
            }
            var readStream = gridStore.stream(true);
            readStream.on('error', function(err) {
                res.json(500, {
                    "Error": " Error while reading image stream from DB - " + err.message
                });
            });
            //Simply 'pipe' read stream to write stream
            readStream.pipe(res);
        });
    }

    function createUser(req, res) {
        var b = req.body;
        var post_data = {
            account_type: b.account_type,
            username: b.username,
            first_name: b.first_name,
            last_name: b.last_name,
            access_token: b.access_token,
            photo_url: b.photo_url,
            account_id: b.account_id,
            email: b.email
        };

        var user = new User(post_data);
        user.save(function(error) {
            if (error) {
                res.json(400, error);
            } else {
                res.json(user);
            }
        });
    }

    function updateUser(req, res) {
        var id = req.params.id;
        var user = req.user;
        if (!id || id != user._id.toString()) {
            res.json(401, {
                "Error": "You can only update currently authenticated user"
            });
            return;
        }
        var b = req.body;
        var new_access_token = req.header('X-foobar-access-token-new');

        var updateObj = getUpdateObject(UserSchema.paths, user, b);
        if (new_access_token) {
            updateObj["access_token"] = new_access_token;
        }

        User.findOneAndUpdate({
            _id: user._id
        }, updateObj, function(error, updatedUser) {
            if (error) {
                res.json(error);
            } else {
                res.json(updatedUser);

            }
        });
    }

    function deleteUser(req, res) {
        var id = req.params.id;
        if (id && id == req.user._id.toString()) {
            req.user.remove(function(error) {
                if (error) {
                    res.json(400, error);
                } else {
                    res.json({
                        "status": "OK"
                    });
                }
            });
        } else {
            res.json(403, {
                "Error": "id not valid. Also Note: you can only delete yourself."
            });
        }
    }

    function readUser(req, res) {
        var id = req.params.id;
        var user = req.user;
        if (id == user._id.toString()) { //current user
            res.json(req.user);
            return;
        }
        User.findOne({
            "_id": id,
        }, { //dont retrieve these..
            'access_token': 0,
            '__v': 0,
            'createdAt': 0,
            'updatedAt': 0
        }, function(err, user) {
            var errCode;
            if (err || !user) {
                var errCode = err ? (err.message == "Invalid ObjectId" ? "INVALID_OBJECT_ID" : "INTERNAL_ERROR") : "USER_NOT_FOUND";
            }
            switch (errCode) {
            case "INVALID_OBJECT_ID":
                res.json(400, {
                    "Error": "Invalid Id. It must conform to MongoDB's objectId format"
                });
                break;
            case "INTERNAL_ERROR":
                res.json(500, {
                    "Error": err.message
                });
                break;
            case "USER_NOT_FOUND":
                res.json(404, {
                    "Error": 'User with id ' + id + ' does not exist'
                });
                break;
            default:
                res.json(user);
                break;
            }
        });

    }

    function getUpdateObject(schemaPath, model, newObj) {
        var updateObj = {};
        for (var key in schemaPath) {
            if (key == '_id') {
                continue;
            }
            if (newObj[key] && (!model[key] || (newObj[key] != model[key]))) {
                updateObj[key] = newObj[key];
            }
        }
        updateObj['updatedAt'] = new Date(); //update timestamp
        return updateObj;
    }

    function validateAndLoadUser(req, res, next) {;
        var method = req.method;
        var reqRoutePath = req.route.path;
        var isCreateUserPath = /\/users\/?$/i.test(reqRoutePath);

        var data = method == "POST" || method == "PUT" ? req.body : req.query;

        data.username = data.username ? data.username : req.header('X-foobar-username');
        data.access_token = data.access_token ? data.access_token : req.header('X-foobar-access-token');
        if (!data.username || !data.access_token) {
            res.json(401, {
                "Error": 'Missing fields - Both username and access_token are required.'
            });
            return;
        }

        User.findOne({
            username: data.username,
            access_token: data.access_token
        }, { //dont retrieve these..
            'access_token': 0,
            '__v': 0,
            'createdAt': 0,
            'updatedAt': 0
        }, function(err, user) {
            if (err) {
                res.json(500, {
                    "Error": err.message
                });
            } else if (user) {
                if (!isCreateUserPath) {
                    req.user = user;
                    next();
                } else {
                    res.json(403, {
                        "Error": 'User with this username and access_token already exists.'
                    });
                }
            } else {
                //create user ..
                if (isCreateUserPath) {
                    next();
                } else {
                    res.json(401, {
                        "Error": ' User not authorized or does not exist'
                    });
                }
            }
        });
    }

    function deleteFile(filePath) {
        fs.unlink(filePath, function(err) {
            if (err) {
                console.log("Could not delete temp file at: " + filePath); //simply log
            }
        });
    }

    app.listen(3000);
    console.log("listening on port %d", 3000);