#!/usr/bin/env node

// this hook installs all your plugins
// recommended to be used with the 'after_platform_add' hook
// based off devgirl's original script from her sample hooks.
// http://www.mooreds.com/sample-hooks.tar.gz

// add your plugins to this list:
// either the identifier, the filesystem location or the URL
var pluginlist = [
    'https://github.com/andresvas/analytics'
];

// requires 'shelljs' (npm install shelljs)
require('shelljs/global');

console.log('Add Plugins:');

// install plugins synchronously
pluginlist.forEach(function(plugin) {
    exec('cordova plugin add ' + plugin);
});