 //Simplified user schema for embedding in other objects like PhotoSchema
 module.exports = function(mongoose, simpleTimestamps) {
     var Schema = mongoose.Schema;
     var EmbeddedUserSchema = new Schema({
         username: String,
         _id: Schema.Types.ObjectId,
         photo_url: String
     });
     return {
         EmbeddedUserSchema: EmbeddedUserSchema,
         EmbeddedUser: mongoose.model('EmbeddedUser', EmbeddedUserSchema)
     };
 };