'use strict';

const FileTestReporter = require('./src/FileTestReporter');
const AllureTestReporter = require('./src/AllureTestReporter');
const config = require('./config');

function isUploadMode(vars) {
    return vars.some(varName => !!process.env[varName]);
}


async function init() {
    try {
        if (isUploadMode(config.requiredVarsForUploadMode)) {
            const fileTestReporter = new FileTestReporter();
            await fileTestReporter.start();
        } else {
            const allureTestReporter = new AllureTestReporter();
            await allureTestReporter.start();
        }
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

init();

