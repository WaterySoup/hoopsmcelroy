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
			this.convertToInlineCss(result.css);
		}
	}.bind(this));
};

// Convert generated CSS to inline styles
generate.convertToInlineCss = function(css) {
	var srcTemplate = fs.readFileSync(path.join(this.srcDir, 'index.html'), 'utf8');
	srcTemplate = '<style>' + css + '</style>' + srcTemplate;
	var html = juice(srcTemplate); 

	var profiles = fs.readdirSync(this.profilesDir);

	var size = profiles.length;

	if (this.profile) {
		this.generateProfile(this.profile);
	} else {
		for (var i = 0; i < size; i++) {
			if (mime.lookup(profiles[i]) === 'application/json') {
				this.generateProfile(profiles[i], html);
			}
		}
	}
};

// Generate a profile with html with inline styles
generate.generateProfile = function(profileData, html) {
	var profileNameParts = profileData.split('.json');
	var profileName = profileNameParts[profileNameParts.length - 2];
	var profile = require(path.join(this.profilesDir, profileData));
	var generatedHtml = ejs.render(html, profile);

	fs.writeFileSync(path.join(this.distDir, profileName + '.html'), generatedHtml);
	// Put generated HTML into a view.
	var viewHtml = ejs.render(defaultTpl, {html: generatedHtml});
	fs.writeFile(path.join(this.viewDir, profileName + '.html'), viewHtml, this.done.bind(this, profileName));
};

// Output results to console.
generate.done = function(profileName, err) {
	if (err) {
		console.info(err);
	} else {
		console.info(this.template + ' for ' + profileName + ' generated successfully.');
	}
};

module.exports = Generate;
