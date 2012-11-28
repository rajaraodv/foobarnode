     var PhotoPost;
     var mongoose;
     var Like;

     module.exports = function(app, m, service) {
         mongoose = m; //store
         PhotoPost = service.useModel("photoPost").PhotoPost; //store
         app.get('/feeds/:page/:limit', readFeeds);
     };


    function readFeeds(req, res) {
        var limit = req.params.limit || 10;
        var page = req.params.page || 1;
        var totalItemsToSkip = (page * limit) - limit; //used when idOfLastItemOfCurrentPage not sent
        var populateConstraints = {
            'post_id': 0,
            'createdAt': 0,
            '__v': 0
        };

        var ppConstraints = {
            "__v": 0
        };

        var sortConstraints = {
            sort: {
                "updatedAt": -1
            }
        };
        var mainQuery = {};

        PhotoPost.find(mainQuery, ppConstraints, sortConstraints).skip(totalItemsToSkip).limit(limit).populate('comments', populateConstraints, null).exec(function(err, results) {
            if(err) {
                res.json(500, "Could not get PhotoPosts - " + err.message);
            } else {
                res.json(results);
            }
        });
    }