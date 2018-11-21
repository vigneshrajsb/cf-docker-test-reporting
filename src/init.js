'use strict';

/* eslint consistent-return: 0 */

const { removeTestReportDir } = require('./FileManager');
const BasicTestReporter = require('./reporter/BasicTestReporter');
const storageConfigManager = require('./storage/StorageConfigManager');
const FileTestReporter = require('./reporter/FileTestReporter');
const AllureTestReporter = require('./reporter/AllureTestReporter');
const config = require('../config');

const basicTestReporter = new BasicTestReporter();

function validateRequiredVars() {
    if (!process.env.BUCKET_NAME) {
        throw new Error('This service require BUCKET_NAME variable');
    }
}

async function init() {
    let isUpload;

    try {
        validateRequiredVars();

        await storageConfigManager.getStorageConfig();

        storageConfigManager.validateStorageConfig();

        const extractedStorageConfig = storageConfigManager.getExtractedStorageConfig();
        storageConfigManager.createStorageConfigFile(extractedStorageConfig);

        isUpload = basicTestReporter.isUploadMode(config.requiredVarsForUploadMode);

        let reporter;
        if (isUpload) {
            reporter = new FileTestReporter();
        } else {
            reporter = new AllureTestReporter();
        }

        const result = await reporter.start({
            isUploadFile: !process.env.REPORT_DIR,
            extractedStorageConfig,
            isUpload
        });

        await removeTestReportDir();

        return result;
    } catch (e) {
        await removeTestReportDir();

        console.error(e.message);
        process.exit(1);
    }
}

module.exports = init;

