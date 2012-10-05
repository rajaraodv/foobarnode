 module.exports = function(User) {
     return function(req, res, next) {
         var method = req.method;
         var reqRoutePath = req.route ? req.route.path : "";
         var originalUrl = req.originalUrl;
         var isCreateUserPath = method == "POST" && (/\/users\/?$/i.test(reqRoutePath) || /\/users\/\.*/.test(originalUrl));
         var isGetPhotosPath = /\/photos\/\.*/.test(reqRoutePath) || /\/photos\/\.*/.test(originalUrl);
         var isHomePath = /^\/$/.test(originalUrl);
         var isFavIcon = /^\/favicon\.ico/.test(originalUrl);
         if(isFavIcon || isHomePath || isGetPhotosPath) {
             next();
             return;
         }

         var data = method == "POST" || method == "PUT" ? req.body : req.query;

         data.username = data.username ? data.username : req.header('X-foobar-username');
         data.access_token = data.access_token ? data.access_token : req.header('X-foobar-access-token');
         if(!data.username || !data.access_token) {
             res.json(401, {
                 "Error": 'Missing fields - Both username and access_token are required.'
             });
             return;
         }

         User.findByUserNameAndAccessToken(data.username, data.access_token, function(err, user) {
             if(err) {
                 res.json(500, {
                     "Error": err.message
                 });
             } else if(user) {
                 if(!isCreateUserPath) {
                     req.user = user;
                     next();
                 } else {
                     res.json(403, {
                         "Error": 'User with this username and access_token already exists.'
                     });
                 }
             } else {
                 //create user ..
                 if(isCreateUserPath) {
                     next();
                 } else {
                     res.json(401, {
                         "Error": ' User not authorized or does not exist'
                     });
                 }
             }
         });
     };
 };