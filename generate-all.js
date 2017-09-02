// Generates the final HTML for all templates
 
var fs = require('fs');
var path = require('path');
var Generate = require('./generate-functions.js');

var templates = fs.readdirSync(path.join(__dirname, 'src'));

var size = templates.length;

for (var i = 0; i < size; i++) {
	if (templates[i] !== 'default.html') {
		new Generate(templates[i]);
	}
}
