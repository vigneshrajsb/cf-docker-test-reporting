'use strict';

const FileTestReporter = require('./FileTestReporter');
const AllureTestReporter = require('./AllureTestReporter');
const config = require('../config');
const fs = require('fs');

function isUploadMode(vars) {
    return vars.some(varName => !!process.env[varName]);
}


async function init() {

    if (!process.env.GCS_CONFIG) {
        return Promise.reject('Environment variable GCS_CONFIG required for this service!');
    }

    /* json config wrapped in single quotes we need remove them before use config */
    fs.writeFileSync(config.googleStorageConfig.keyFilename, process.env.GCS_CONFIG);

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

