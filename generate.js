// Generates the final HTML for a template (or single character)
var Generate = require('./generate-functions.js');

var profile = process.argv.length > 3 ? process.argv[3] : undefined;

new Generate(process.argv[2], profile);
