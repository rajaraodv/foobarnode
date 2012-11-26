'use strict';
var simpleTimestamps = require(__dirname + '/../lib/utils/simpleTimestamps').SimpleTimestamps;
var mongoose;
var User;

module.exports.init = function(m) {
    mongoose = m;
    User = require(__dirname + '/../lib/models/user')(m, simpleTimestamps).User;
    module.exports.validateAndLoadUser = getValidatorMiddleWare(User);
};

module.exports.useModel = function(modelName) {
    return require(__dirname + '/../lib/models/' + modelName)(mongoose, simpleTimestamps);
};


module.exports.useUtil = function(utilName) {
    return require(__dirname + '/../lib/utils/' + utilName);
};

function getValidatorMiddleWare(User) {
    return require(__dirname + '/../lib/middlewares/validateAndLoadUser')(User);
}