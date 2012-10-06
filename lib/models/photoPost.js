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
        // liked_by: [EmbeddedUserSchema],
        comments: [{
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }]
    });

    PhotoPostSchema.plugin(simpleTimestamps);
    
    return {
        PhotoPost: mongoose.model('PhotoPost', PhotoPostSchema),
        PhotoPostSchema: PhotoPostSchema
    };
};