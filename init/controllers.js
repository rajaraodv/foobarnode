var fs = require('fs');

module.exports = function(app, mongoose, service) {
	fs.readdir(__dirname + '/../lib/controllers', function(err, files) {
		if (err) throw err;
		files.forEach(function(file) {
			var name = file.replace('.js', '');
			require(__dirname + '/../lib/controllers/' + name)(app, mongoose, service);
		});
	});
};