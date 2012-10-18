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

        UserSchema.statics.getUpdateObject = function(model, newObj) {
            var updateObj = {};
            var schemaPath = UserSchema.paths;
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

        UserSchema.statics.update = function(id, updateObj, callback) {
            User.findOneAndUpdate({
                _id: id
            }, updateObj, function(err, u) {
                callback(err, u);
            });
        };

        UserSchema.statics.create = function(post_data, callback) {
            var user = new User(post_data);
            user.save(function(err) {
                callback(err, user);
            });
        };

        UserSchema.plugin(simpleTimestamps);
        var User = mongoose.model('User', UserSchema);

        return {
            User: User,
            UserSchema: UserSchema
        };
    };