'use strict';

const FileTestReporter = require('./src/FileTestReporter');
const AllureTestReporter = require('./src/AllureTestReporter');
const config = require('./config');
const fs = require('fs');

/* json config wrapped in single quotes we need remove them before use config */
let content = fs.readFileSync(config.googleStorageConfig.keyFilename);
content = content.toString().replace(/'/gm, '');
fs.writeFileSync(config.googleStorageConfig.keyFilename, content);

function isUploadMode(vars) {
    return vars.some(varName => !!process.env[varName]);
}


async function init() {
    try {
        let reporter;
        if (isUploadMode(config.requiredVarsForUploadMode)) {
            reporter = new FileTestReporter();
        } else {
            reporter = new AllureTestReporter();
        }

        await reporter.start();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

init();

