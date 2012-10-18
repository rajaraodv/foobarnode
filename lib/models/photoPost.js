module.exports = function(mongoose, simpleTimestamps) {
    var PhotoSchema = require('./photo.js')(mongoose, simpleTimestamps).PhotoSchema;
    var EmbeddedUserSchema = require('./embeddedUser.js')(mongoose, simpleTimestamps).EmbeddedUserSchema;
    var Schema = mongoose.Schema;

    var PhotoPostSchema = new Schema({
        creator: {
            type: EmbeddedUserSchema.tree,
            required: true
        },
        photo: {
            type: PhotoSchema.tree,
            required: true
        },
        product_id: {
            type: String,
            required: true
        },
        photo_caption: {
            type: String,
            "default": ""
        },
        likes_cnt: {
            type: Number,
            "default": 0
        },
        comments_cnt: {
            type: Number,
            "default": 0
        },
        liked_by: [String],
        comments: [{
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }]
    });

    PhotoPostSchema.statics.updateCreator = function(id, fieldsToUpdate, callback) {
        PhotoPost.update({
            "creator._id": id
        }, {
            "$set": fieldsToUpdate
        }, {
            multi: true
        }, function(err, count) {
            callback(err, count);
        });
    };

    PhotoPostSchema.statics.create = function(photoPostParams, callback) {
        var params = {
            creator: photoPostParams.creator,
            photo: photoPostParams.photo,
            product_id: photoPostParams.product_id,
            photo_caption: photoPostParams.photo_caption
        };

        var photoPost = new PhotoPost(params);
        photoPost.save(function(err) {
            callback(err, photoPost);
        });
    };

    PhotoPostSchema.plugin(simpleTimestamps);
    var PhotoPost = mongoose.model('PhotoPost', PhotoPostSchema);

    return {
        PhotoPost: PhotoPost,
        PhotoPostSchema: PhotoPostSchema
    };
};