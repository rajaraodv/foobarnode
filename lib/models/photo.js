module.exports = function(mongoose, simpleTimestamps) {
    var Schema = mongoose.Schema;
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
    return {
        PhotoSchema: PhotoSchema,
        Photo: mongoose.model('Photo', PhotoSchema)
    };
};