//PhotoPosts
var PhotoPost;
var EmbeddedUser;
var Photo;
var Comment;
var Like;

var mongo;
var GridStore;
var ObjectID;
var BSON;
var fs = require('fs');
var im = require('imagemagick');
var Step = require('step');

module.exports = function(app, m, service) {
    //store
    mongoose = m;
    mongo = m.mongo;
    GridStore = mongo.GridStore;
    ObjectID = mongo.ObjectID;
    BSON = mongo.BSONPure;

    PhotoPost = service.useModel("photoPost").PhotoPost;
    EmbeddedUser = service.useModel("embeddedUser").EmbeddedUser;
    Comment = service.useModel("comment").Comment;
    Like = service.useModel("Like").Like;
    Photo = service.useModel("photo").Photo;
    //create
    app.post('/photoposts', service.validateAndLoadUser, createPhotoPost);
    //read
    app.get('/photoposts/:id', service.validateAndLoadUser, readPhotoPost);
    //update
    app.put('/photoposts/:id', service.validateAndLoadUser, updatePhotoPost);
    //delete
    app["delete"]('/photoposts/:id', service.validateAndLoadUser, deletePhotoPost);

    //Photos - returns raw photo image
    app.get('/photos/:id', readPhoto);
};

function createPhotoPost(req, res) {
    var filePath;
    var fileName;
    try {
        filePath = req.files.pic.path;
        fileName = req.files.pic.name;
    } catch(e) {}
    if(!fileName || fileName == "") {
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
        if(err) {
            throw err;
        }
        var width;
        var height;
        try {
            //get 3rd word and split it
            var tmp = rawMetaData.split(" ")[2].split(/x/);
            width = parseInt(tmp[0]);
            height = parseInt(tmp[1]);
        } catch(e) {

        }
        return {
            width: width,
            height: height
        };
    }, function saveToGridFS(err, fMetaData) {
        if(err) {
            throw err;
        }
        fileMetaData = fMetaData; //save
        var gridStoreWrite = new GridStore(mongoose.connection.db, new ObjectID(), fileName, "w");
        gridStoreWrite.writeFile(filePath, this);
    }, function handleSaveToGridFSfunction(err, photoObject) {
        if(err) {
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
        if(err) {
            throw err;
        } /* save for further usage */
        savedPhotoPost = photoPost;
        photoPost.save(this);
    }, function handleSavePhotoPost(err) {
        if(err) {
            throw err;
        }
        return null; //must return something
    }, function last(err) {
        if(err) {
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
    } catch(e) {
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
        if(err) {
            res.json(500, {
                "Error": err.toString()
            });
        } else if(!photoPost) {
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
        if(!photo_caption || photo_caption.replace(/^\s*|\s*$/g, '') == "") {
            http_status = 400;
            throw new Error('photo_caption text is missing and/or is empty');
        }
        try {
            BSON.ObjectID.createFromHexString(id); //store
        } catch(e) {
            http_status = 400;
            throw new Error('Invalid PhotoPost id ' + id + ": " + e.message);
        }
        return null;
    }, function findPP(err) {
        if(err) {
            throw err;
        }
        PhotoPost.findById(id).exec(this);
    }, function handleFindPP(err, photoPost) {
        if(err) {
            throw err;
        } else if(!photoPost) {
            http_status = 404;
            throw new Error("PhotoPost not found");
        }
        if(photoPost.creator._id.toString() != user._id.toString()) {
            http_status = 401;
            throw new Error("You can only update currently authenticated user's PhotoPost");
        }
        return photoPost;
    }, function addCaption2PP(err, photoPost) {
        if(err) {
            throw err;
        }
        photoPostRef = photoPost; //store
        photoPost.photo_caption = photo_caption;
        photoPost.updatedAt = new Date();
        photoPost.save(this);
    }, function handleAddCaption2PP(err) {
        if(err) {
            throw new Error("Could not update PhotoPost - " + err.message);
        }
        return null;
    }, function last(err) {
        if(err) {
            res.json(http_status || 500, {
                "Error": err.toString()
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
        } catch(e) {
            http_status = 400;
            throw new Error('Invalid post_id ' + id + ": " + e.message);
        }
        return null;
    }, function findPhotoPost(err) {
        if(err) {
            throw err;
        }
        PhotoPost.findById(id).exec(this);
    }, function handleFindPhotoPost(err, photoPost) {
        if(err) {
            throw err;
        } else if(!photoPost) {
            http_status = 404;
            throw new Error("PhotoPost not found");
        }
        if(photoPost.creator._id.toString() != user._id.toString()) {
            http_status = 401;
            throw new Error("You can only delete currently authenticated user's PhotoPost");
        }

        photoPostObj = photoPost; // store
        return null;
    }, function deletePP(err) {
        if(err) {
            throw err;
        }
        photoPostObj.remove(this);
    }, function handleDelPP(err) {
        if(err) {
            throw err;
        }
        return null;
    }, function deletePPComments(err) {
        if(err) {
            throw err;
        }
        Comment.where('post_id').equals(photoPostObjectId).remove(this);
    }, function deletePPLikes(err) {
        if(err) {
            throw err;
        }
        Like.where('post_id').equals(photoPostObjectId).remove(this);
    }, function openGridStoreToDelPhoto(err) {
        if(err) {
            throw err;
        }
        var gridStore = new GridStore(mongoose.connection.db, photoPostObj.photo._id, "r");
        gridStore.open(this);
    }, function handleOpenGridStoreToDelPhoto(err, gridStore) {
        if(err) {
            throw err;
        }
        gridStore.unlink(this); //delete photo
    }, function last(err) {
        if(err) {
            res.json(http_status || 500, {
                "Error": err.toString()
            });
        } else {
            res.json({
                "Status": "OK"
            });
        }
    });
}

function readPhoto(req, res) {
    var id = req.params.id;
    var o_id;
    //Construct ObjectID from 'id' string
    try {
        o_id = BSON.ObjectID.createFromHexString(id);
    } catch(e) {
        res.json(500, {
            "Error": id + " id - " + e.message
        });
        return;
    }

    //Create GridStore in READ mode
    var gridStore = new GridStore(mongoose.connection.db, o_id, "r");
    gridStore.open(function(err, gridStore) {
        if(err) {
            res.json(404, {
                "Error": err
            });
            return;
        }
        var readStream = gridStore.stream(true);
        readStream.on('error', function(err) {
            res.json(500, {
                "Error": " Error while reading image stream from DB - " + err
            });
        });
        //Simply 'pipe' read stream to write stream
        readStream.pipe(res);
    });
}


function deleteFile(filePath) {
    fs.unlink(filePath, function(err) {
        if(err) {
            console.log("Could not delete temp file at: " + filePath); //simply log
        }
    });
}