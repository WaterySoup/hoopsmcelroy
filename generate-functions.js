// Functions for generating final HTML

var fs = require('fs');
var path = require('path');
var mime = require('mime-types');
var sass = require('node-sass');
var juice = require('juice');
juice.codeBlocks.EJS = {start: '<%', end: '%>'};
var ejs = require('ejs');
var defaultTpl = fs.readFileSync(path.join(__dirname, 'src', 'default.html'), 'utf8');

var generate = Generate.prototype;

function Generate(template, profile) {
	this.template = template;
	this.profile = profile;
	var logString = 'Generating ' + template;
	if (profile) {
		logString += ' for ' + profile;
	}
	logString += '...';
	console.info(logString);
	this.srcDir = path.join(__dirname, 'src', this.template);
	this.distDir = path.join(__dirname, 'dist', this.template);
	this.viewDir = path.join(this.distDir, 'view');
	this.profilesDir = path.join(__dirname, 'profiles', this.template);
	this.generateTemplate();
}

// Generates a template
generate.generateTemplate = function() {
	// Create relevant dist folder for template if it doesn't already exist
	if (!fs.existsSync(this.viewDir)) {
		var initDir = path.isAbsolute(this.viewDir) ? path.sep : '';
		this.viewDir.split(path.sep).reduce(function(parentDir, childDir) {
			var curDir = path.resolve(parentDir, childDir);
			if (!fs.existsSync(curDir)) {
				fs.mkdirSync(curDir);
			}

			return curDir;
		}, initDir);
	}
	this.compileSass();
};

// Compile sass
generate.compileSass = function() {
	sass.render({
		file: path.join(this.srcDir, 'scss', 'main.scss')
	}, function(error, result) {
		if (!error) {
			this.prepareTemplate(result.css);
		} else {
			console.info(error);
		}
	}.bind(this));
};

// Prepare template for profile generation
generate.prepareTemplate = function(css) {
	var srcTemplate = fs.readFileSync(path.join(this.srcDir, 'index.html'), 'utf8');
	fs.writeFile(path.join(this.distDir, 'main.css'), css, this.fsCallback);

	var profiles = fs.readdirSync(this.profilesDir);

	var size = profiles.length;

	if (this.profile) {
		this.generateProfile(this.profile + '.json', srcTemplate, css);
	} else {
		for (var i = 0; i < size; i++) {
			if (mime.lookup(profiles[i]) === 'application/json') {
				this.generateProfile(profiles[i], srcTemplate, css);
			}
		}
	}
};

// Generate a profile with html with inline styles and convert CSS to inline styles.
generate.generateProfile = function(profileData, srcTemplate, css) {
	var profileNameParts = profileData.split('.json');
	var profileName = profileNameParts[profileNameParts.length - 2];
	// Require doesn't work well with watch as it uses the original JSON files for the entire time the script is live and doesn't detect changes to the required file.
	var profile = JSON.parse(fs.readFileSync(path.join(this.profilesDir, profileData), 'utf8'));
	var html = ejs.render(srcTemplate, profile);
	var generatedHtml = '<style>' + css + '</style>' + html;
	// Unfortunately, some classes may not actually be available until after the HTML templates have been processed with EJS, so we delay converting CSS until the end.
	convertedHtml = juice(generatedHtml);

	var promises = [];
	promises.push(fs.writeFile(path.join(this.distDir, profileName + '.html'), convertedHtml, this.fsCallback));
	promises.push(fs.writeFile(path.join(this.distDir, profileName + '-css.html'), html, this.fsCallback));
	// Put generated HTML into a view.
	var viewHtml = ejs.render(defaultTpl, {html: convertedHtml, withCss: false});
	var viewCssHtml = ejs.render(defaultTpl, {html: html, withCss: true});
	promises.push(fs.writeFile(path.join(this.viewDir, profileName + '-css.html'), viewCssHtml, this.fsCallback));
	promises.push(fs.writeFile(path.join(this.viewDir, profileName + '.html'), viewHtml, this.fsCallback));
	Promise.all(promises).then(this.done.bind(this, profileName));
};

generate.fsCallback = function(err) {
	if (err) {
		console.info('Error writing file', err);
	}
};

// Output results to console.
generate.done = function(profileName) {
	console.info(this.template + ' for ' + profileName + ' generated successfully.');
};

module.exports = Generate;
