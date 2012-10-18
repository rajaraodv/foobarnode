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

    LikeSchema.statics.create = function(likeParams, callback) {
        var params = {
            creator: likeParams.creator,
            post_id: likeParams.post_id
        };

        var l = new Like(params);
        l.save(function(err) {
            callback(err, l);
        });
    };

    LikeSchema.statics.updateCreator = function(id, fieldsToUpdate, callback) {
        Like.update({
            "creator._id": id
        }, {
            "$set": fieldsToUpdate
        }, {
            multi: true
        }, function(err, count) {
            callback(err, count);
        });
    };
    var Like = mongoose.model('Like', LikeSchema);
    return {
        LikeSchema: LikeSchema,
        Like: Like
    };
};