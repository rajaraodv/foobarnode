module.exports = function(mongoose, simpleTimestamps) {
    var EmbeddedUserSchema = require('./embeddedUser.js')(mongoose, simpleTimestamps).EmbeddedUserSchema;
    var Schema = mongoose.Schema;
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
    return {
        LikeSchema: LikeSchema,
        Like: mongoose.model('Like', LikeSchema)
    };
};