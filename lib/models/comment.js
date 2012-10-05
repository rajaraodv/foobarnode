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
    return {
        CommentSchema: CommentSchema,
        Comment: mongoose.model('Comment', CommentSchema)
    };
};