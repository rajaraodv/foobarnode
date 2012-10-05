    module.exports = function(mongoose, simpleTimestamps) {
        var Schema = mongoose.Schema;

        var accountTypes = ['facebook', 'twitter'];
        var UserSchema = new Schema({
            account_type: {
                type: String,
                "enum": accountTypes,
                required: true
            },
            username: {
                type: String,
                required: true
            },

            first_name: String,
            last_name: String,
            access_token: {
                type: String,
                required: true
            },
            account_id: String,
            photo_url: {
                type: String,
                required: true
            },
            email: String
        });

        UserSchema.statics.findByUserNameAndAccessToken = function(username, access_token, cb) {
            this.findOne({
                username: username,
                access_token: access_token
            }, { //dont retrieve these..
                'access_token': 0,
                '__v': 0,
                'createdAt': 0,
                'updatedAt': 0
            }, cb);
        };

        UserSchema.statics.getUpdateObject = function(schemaPath, model, newObj) {
            var updateObj = {};
            for(var key in schemaPath) {
                if(key == '_id') {
                    continue;
                }
                if(newObj[key] && (!model[key] || (newObj[key] != model[key]))) {
                    updateObj[key] = newObj[key];
                }
            }
            //Update timestamp.
            updateObj['updatedAt'] = new Date();
            return updateObj;
        };

        UserSchema.plugin(simpleTimestamps);

        return {
            User: mongoose.model('User', UserSchema),
            UserSchema: UserSchema
        };
    };