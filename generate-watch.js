// Watches for file changes in templates and profiles and automatically generates changed templates.

var path = require('path');
var Generate = require('./generate-functions.js');
var watch = require('watch');
var mime = require('mime-types');

var template = process.argv[2];

var profile = process.argv.length > 3 ? process.argv[3] : undefined;

var watchDir = path.join(__dirname, 'src', template);
var profileDir = path.join(__dirname, 'profiles', template);

// We don't need to watch every file that has no effect on generation, so ignore everything that isn't an HTML file or SASS.
var filterTemplates = function(file, stat) {
	var filetype = mime.lookup(file);
	return filetype === 'text/x-sass' || filetype === 'text/x-scss' || filetype === 'text/html' || stat.isDirectory();
};

// Only .json files are valid profiles.
var filterProfiles = function(file, stat) {
	return mime.lookup(file) === 'application/json';
};

new Generate(template, profile);

var logString = 'Watching ' + template;
if (profile) {
	logString += ' for ' + profile;
}
logString += '...';
console.info(logString);

// Watch for changes in templates
watch.watchTree(watchDir, {filter: filterTemplates}, function(f, curr, prev) {
	if (typeof f === 'object' && prev === null && curr === null) {
	
	} else {
		console.info('template changed');
		new Generate(template);
	}
});

// Watch for changes in profiles
watch.watchTree(profileDir, {filter: filterProfiles}, function(f, curr, prev) {
	if (typeof f == 'object' && prev === null && curr === null) {
	
	} else {
		var parts = path.basename(f).split('.json');
		var profileName = parts[parts.length - 2];
		if (profile && profile === profileName || !profile) {
			console.info('profile changed');
			new Generate(template, profileName);
		}
	}
});

