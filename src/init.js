'use strict';

/* eslint consistent-return: 0 */

const { removeTestReportDir } = require('./FileManager');
const BasicTestReporter = require('./reporter/BasicTestReporter');
const StorageConfigProvider = require('./storage/StorageConfigProvider');
const FileTestReporter = require('./reporter/FileTestReporter');
const AllureTestReporter = require('./reporter/AllureTestReporter');
const PaymentsLogic = require('./paymentsLogic');
const config = require('../config');

const basicTestReporter = new BasicTestReporter();
const storageConfigProvider = new StorageConfigProvider();

function validateRequiredVars() {
    if (!process.env.BUCKET_NAME) {
        throw new Error('This service require BUCKET_NAME variable');
    }
}

async function init() {
    let isUpload;

    try {
        validateRequiredVars();

        const extractedStorageConfig = await storageConfigProvider.provide();

        await PaymentsLogic.setMaxUploadSizeDependingOnPlan();

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

