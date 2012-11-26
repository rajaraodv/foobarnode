    //Users
    var User;
    var mongoose;
    var PhotoPost;
    var EmbeddedUser;
    var Comment;
    var Like;
    var Step = require('step');

    module.exports = function(app, m, service) {
        //store
        mongoose = m;
        var useObj = service.useModel('user');
        User = useObj.User;
        PhotoPost = service.useModel('photoPost').PhotoPost;
        EmbeddedUser = service.useModel('embeddedUser').EmbeddedUser;
        Comment = service.useModel('comment').Comment;
        Like = service.useModel('like').Like;

        //create
        app.post('/users', service.validateAndLoadUser, createUser);

        //read
        app.get('/users/:id', service.validateAndLoadUser, readUser);

        //update
        app.put('/users/:id', service.validateAndLoadUser, updateUser);

        //delete
        app['delete']('/users/:id', service.validateAndLoadUser, deleteUser);
    };


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

        User.create(post_data, function(err, user) {
            if(err) {
                res.json(400, err);
            } else {
                res.json(user);
            }
        });
    }

    function updateUser(req, res) {
        var id = req.params.id;
        var user = req.user;
        if(!id || (id != 'me' && id != user._id.toString())) {
            res.json(401, {
                'Error': 'You can only update currently authenticated user'
            });
            return;
        }
        var b = req.body;
        var new_access_token = req.header('X-foobar-access-token-new');
        var updateObj = User.getUpdateObject(user, b);
        var embeddableObjToUpdate = EmbeddedUser.getEmbeddableObjToUpdate(updateObj);
        if(new_access_token) {
            updateObj.access_token = new_access_token;
        }

        var updatedUserRef; //store result
        Step(function updateUser() {
            User.update({
                _id: user._id
            }, updateObj, this);
        }, function handleUpdateUser(err, updatedUser) {
            if(err) {
                throw err;
            }
            updatedUserRef = updatedUser;
            return null;
        }, function updatePhotoPostsCreator(err) {
            if(err) {
                throw err;
            } else if(!embeddableObjToUpdate) {
                return null;
            }
            PhotoPost.updateCreator(updatedUserRef._id, embeddableObjToUpdate, this);
        }, function updateCommentsCreator(err) {
            if(err) {
                throw err;
            } else if(!embeddableObjToUpdate) {
                return null;
            }
            Comment.updateCreator(updatedUserRef._id, embeddableObjToUpdate, this);
        }, function updateLikesCreator(err) {
            if(err) {
                throw err;
            } else if(!embeddableObjToUpdate) {
                return null;
            }
            Like.updateCreator(updatedUserRef._id, embeddableObjToUpdate, this);
        }, function last(err) {
            if(err) {
                res.json(err);
            } else {
                res.json(updatedUserRef);
            }
        });
    }

    function deleteUser(req, res) {
        var id = req.params.id;
        if(id && id == req.user._id.toString()) {
            req.user.remove(function(error) {
                if(error) {
                    res.json(400, error);
                } else {
                    res.json({
                        'status': 'OK'
                    });
                }
            });
        } else {
            res.json(403, {
                'Error': 'id not valid. Also Note: you can only delete yourself.'
            });
        }
    }

    function readUser(req, res) {
        var id = req.params.id;
        var user = req.user;
        if(id === 'me' || id == user._id.toString()) { //current user
            res.json(req.user);
            return;
        }
        User.findOne({
            '_id': id
        }, { //dont retrieve these..
            'access_token': 0,
            '__v': 0,
            'createdAt': 0,
            'updatedAt': 0
        }, function(err, user) {
            var errCode;
            if(err || !user) {
                errCode = err ? (err.message == 'Invalid ObjectId' ? 'INVALID_OBJECT_ID' : 'INTERNAL_ERROR') : 'USER_NOT_FOUND';
            }
            switch(errCode) {
            case 'INVALID_OBJECT_ID':
                res.json(400, {
                    'Error': 'Invalid Id. It must conform to MongoDB\'s objectId format'
                });
                break;
            case 'INTERNAL_ERROR':
                res.json(500, {
                    'Error': err.message
                });
                break;
            case 'USER_NOT_FOUND':
                res.json(404, {
                    'Error': 'User with id ' + id + 'does not exist '
                });
                break;
            default:
                res.json(user);
                break;
            }
        });

    }