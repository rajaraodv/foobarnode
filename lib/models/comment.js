module.exports = function(mongoose, simpleTimestamps) {
    var EmbeddedUserSchema = require('./embeddedUser.js')(mongoose, simpleTimestamps).EmbeddedUserSchema;
    var Schema = mongoose.Schema;
    
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

    CommentSchema.statics.create = function(commentParams, callback) {
        var params = {
            creator: commentParams.creator,
            text: commentParams.text,
            post_id: commentParams.post_id
        };

        var c = new Comment(params);
        c.save(function(err) {
            callback(err, c);
        });
    };

    CommentSchema.statics.updateCreator = function(id, fieldsToUpdate, callback) {
        Comment.update({
            "creator._id": id
        }, {
            "$set": fieldsToUpdate
        }, {
            multi: true
        }, function(err, count) {
            callback(err, count);
        });
    };

    var Comment = mongoose.model('Comment', CommentSchema);
    return {
        CommentSchema: CommentSchema,
        Comment: Comment
    };
};