 //Simplified user schema for embedding in other objects like PhotoSchema
 module.exports = function(mongoose, simpleTimestamps) {
     var Schema = mongoose.Schema;
     var EmbeddedUserSchema = new Schema({
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
         EmbeddedUserSchema: EmbeddedUserSchema,
         EmbeddedUser: mongoose.model('EmbeddedUser', EmbeddedUserSchema)
     };
 };