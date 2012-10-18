 //Simplified user schema for embedding in other objects like PhotoSchema
 module.exports = function(mongoose, simpleTimestamps) {
     var Schema = mongoose.Schema;
     var EmbeddedUserSchema = new Schema({
         username: String,
         _id: Schema.Types.ObjectId,
         photo_url: String,
         first_name: String
     });
      EmbeddedUserSchema.statics.getEmbeddableObjToUpdate = function(newUserPropsObj) {
            var schemaPath = EmbeddedUserSchema.paths;
            var embeddableObjToUpdate;
            for(var key in newUserPropsObj) {
                if(key == "username" || key == "photo_url" || key == "first_name") {
                    if(!embeddableObjToUpdate) {
                        embeddableObjToUpdate = {};
                    }
                    embeddableObjToUpdate["creator."+key] = newUserPropsObj[key];
                    
                }
            }
            return embeddableObjToUpdate;
        };

     return {
         EmbeddedUserSchema: EmbeddedUserSchema,
         EmbeddedUser: mongoose.model('EmbeddedUser', EmbeddedUserSchema)
     };
 };