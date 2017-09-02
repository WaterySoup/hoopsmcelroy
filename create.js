// Creates starting files for a template

var fs = require('fs');
var path = require('path');
var defaultTpl = fs.readFileSync(path.join(__dirname, 'src', 'default.html'), 'utf8');

var template = process.argv[2];
var tplDir = path.join(__dirname, 'src', template);

// Check if template already exists
if (fs.existsSync(tplDir)) {
	console.info('Template ' + template + ' already exists.');
	return false;
}

// Create folders and files
fs.mkdirSync(tplDir);
fs.mkdirSync(path.join(tplDir, 'scss'));
fs.mkdirSync(path.join(__dirname, 'profiles', template));
fs.writeFileSync(path.join(tplDir, 'index.html'), '<!-- Create your template here -->');
fs.writeFile(path.join(tplDir, 'scss', 'main.scss'), '// Add your CSS/SASS here', function(err) {
	if (err) {
		console.info(err);
	} else {
		console.info('Template ' + template + ' created successfully.');
	}
});
