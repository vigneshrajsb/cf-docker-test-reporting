const fs = require('fs');
const path = require('path');

void function() {
    if(!fs.existsSync(path.resolve('./build/index.js'))){
        fs.copyFileSync( path.resolve('./serverConfig.js') , path.resolve('./build/index.js'), true );
    }
    console.log('File "serverConfig.js"exists only for require function can find this module, dont remove it (in "build" path with name "index.js")');
    console.log('This file needs for "backend" usage');
    console.log('File Copied');
}();
