    //Comments
    var PhotoPost;
    var EmbeddedUser;
    var Comment;

    var mongoose;
    var mongo;
    var ObjectID;
    var BSON;

    var Step = require('step');
    module.exports = function(app, m, service) {
        //store
        mongoose = m;
        mongo = m.mongo;
        ObjectID = mongo.ObjectID;
        BSON = mongo.BSONPure;

        PhotoPost = service.useModel("photoPost").PhotoPost; //store
        EmbeddedUser = service.useModel("embeddedUser").EmbeddedUser; //store
        Comment = service.useModel("comment").Comment; //store
        //create
        app.post('/comments', service.validateAndLoadUser, createComment);
        //read
        app.get('/comments/:id', service.validateAndLoadUser, readComment);
        //update
        app.put('/comments/:id', service.validateAndLoadUser, updateComment);
        //delete
        app.delete('/comments/:id', service.validateAndLoadUser, deleteComment);
    };


    function createComment(req, res) {
        var b = req.body;
        var post_id = b.post_id;
        var text = b.text;

        var photoPost; //store photoPost of the comment
        var http_status; //store the status code
        var comment; //store comment
        Step(function validateRequiredFields() {
            if(!post_id || !text) {
                http_status = 400;
                throw new Error("Either 'post_id' or 'text' parameter is missing");
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
        }, function saveComment(err) {
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
            comment = new Comment({
                creator: eUser,
                text: text,
                post_id: photoPost._id
            });
            comment.save(this);
        }, function handleSaveComment(err) {
            if(err) {

                throw err;
            }
            return null;
        }, function addCommentInfo2PhotoPost(err) {
            if(err) {
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
                res.json(comment);
            }
        });
    }

    function readComment(req, res) {
        var id = req.params.id;
        Step(function validateRequiredFields() {
            try {
                BSON.ObjectID.createFromHexString(id); //store
            } catch(e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findComment(err) {
            if(err) {
                throw err;
            }
            Comment.findById(id, {
                '__v': 0
            }).exec(this);
        }, function handleFindComment(err, comment) {
            if(err) {
                res.json(400, {
                    "Error": err.message
                });
            } else if(!comment) {
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
            if(!text || text.replace(/^\s*|\s*$/g, '') == "") {
                http_status = 400;
                throw new Error('Comment text cannot be empty or is missing');
            }
            try {
                BSON.ObjectID.createFromHexString(id); //store
            } catch(e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findComment(err) {
            if(err) {
                throw err;
            }
            Comment.findById(id).exec(this);
        }, function handleFindComment(err, comment) {
            if(err) {
                throw err;
            } else if(!comment) {
                http_status = 404;
                throw new Error("Comment not found");
            }
            if(comment.creator._id.toString() != user._id.toString()) {
                http_status = 401;
                throw new Error("You can only update currently authenticated user's comment");
            }

            updatedComment = comment; // store
            comment.text = text;
            comment.updatedAt = new Date();
            comment.save(this);
        }, function updatePPTimeStamp(err) {
            if(err) {
                throw err;
            }
            var updateObj = {
                "updatedAt": new Date()
            };

            PhotoPost.findOneAndUpdate({
                _id: updatedComment.post_id
            }, updateObj, this);
        }, function HandleUpdatePPTimeStamp(err, updatedPhotoPost) {
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
            } else if(!updatedComment) {
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
            } catch(e) {
                http_status = 400;
                throw new Error('Invalid post_id ' + id + ": " + e.message);
            }
            return null;
        }, function findComment(err) {
            if(err) {
                throw err;
            }
            Comment.findById(id).exec(this);
        }, function handleFindComment(err, comment) {
            if(err) {
                throw err;
            } else if(!comment) {
                http_status = 404;
                throw new Error("Comment not found");
            }
            if(comment.creator._id.toString() != user._id.toString()) {
                http_status = 401;
                throw new Error("You can only delete currently authenticated user's comment");
            }

            commentObj = comment; // store
            return null;
        }, function deleteC(err) {
            if(err) {
                throw err;
            }
            commentObj.remove(this);
        }, function handleDelC(err) {
            if(err) {
                throw err;
            }
            return null;
        }, function decrPhotoPostComment(err) {
            if(err) {
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