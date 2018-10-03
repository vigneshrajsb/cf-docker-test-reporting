'use strict';

const FileTestReporter = require('./FileTestReporter');
const AllureTestReporter = require('./AllureTestReporter');
const config = require('../config');
const fs = require('fs');

function isUploadMode(vars) {
    return vars.some(varName => !!process.env[varName]);
}


async function init() {
    /* json config wrapped in single quotes we need remove them before use config */
    let content = fs.readFileSync(config.googleStorageConfig.keyFilename);
    content = content.toString().replace(/'/gm, '');
    fs.writeFileSync(config.googleStorageConfig.keyFilename, content);

    try {
        let reporter;
        if (isUploadMode(config.requiredVarsForUploadMode)) {
            reporter = new FileTestReporter();
        } else {
            reporter = new AllureTestReporter();
        }

        return await reporter.start();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

module.exports = init;

