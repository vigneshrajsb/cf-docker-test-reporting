'use strict';

/* eslint consistent-return: 0 */

const { removeTestReportDir } = require('./FileManager');
const FileTestReporter = require('./FileTestReporter');
const AllureTestReporter = require('./AllureTestReporter');
const config = require('../config');
const fs = require('fs');

function isUploadMode(vars) {
    return vars.some(varName => !!process.env[varName]);
}


async function init() {
    let isUpload;

    try {
        if (!process.env.GCS_CONFIG) {
            throw new Error('Environment variable GCS_CONFIG required for this service!');
        }

        /* json config wrapped in single quotes we need remove them before use config */
        fs.writeFileSync(config.googleStorageConfig.keyFilename, process.env.GCS_CONFIG);

        isUpload = isUploadMode(config.requiredVarsForUploadMode);

        let reporter;
        if (isUpload) {
            reporter = new FileTestReporter();
        } else {
            reporter = new AllureTestReporter();
        }

        const result = await reporter.start(!process.env.REPORT_DIR);

        if (!isUpload || process.env.CLEAR_TEST_REPORT) {
            await removeTestReportDir(config.sourceReportFolderName);
        }

        return result;
    } catch (e) {
        if (!isUpload || process.env.CLEAR_TEST_REPORT) {
            await removeTestReportDir(config.sourceReportFolderName);
        }

        console.error(e.message);
        process.exit(1);
    }
}

module.exports = init;

