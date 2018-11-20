'use strict';

/* eslint consistent-return: 0 */

const { removeTestReportDir } = require('./FileManager');
const BasicTestReporter = require('./BasicTestReporter');
const storageConfigManager = require('./storage/StorageConfigManager');
const FileTestReporter = require('./FileTestReporter');
const AllureTestReporter = require('./AllureTestReporter');
const config = require('../config');
const storageTypes = require('./storage/storageTypes');
const fs = require('fs');

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
        if (extractedStorageConfig.type === 'json') {
            const jsonConfigFileName = extractedStorageConfig.integrationType === storageTypes.google ?
                config.googleStorageConfig.keyFilename : config.amazonKeyFileName;

            fs.writeFileSync(jsonConfigFileName, JSON.stringify(extractedStorageConfig.storageConfig));
        }

        await basicTestReporter.setExportVariable('TEST_REPORT_INTEGRATION_TYPE', extractedStorageConfig.integrationType);

        isUpload = basicTestReporter.isUploadMode(config.requiredVarsForUploadMode);

        if (isUpload) {
            console.log('Using custom upload mode (only upload custom folder or file)');
        } else {
            console.log('Using allure upload mode (generate allure visualization and upload it)');
        }

        let reporter;
        if (isUpload) {
            reporter = new FileTestReporter();
        } else {
            reporter = new AllureTestReporter();
        }

        if (extractedStorageConfig.name) {
            console.log(`Using storage integration, name: ${extractedStorageConfig.name}`);
            await basicTestReporter.setExportVariable('TEST_REPORT_CONTEXT', extractedStorageConfig.name);
        }

        const result = await reporter.start({
            isUploadFile: !process.env.REPORT_DIR,
            extractedStorageConfig
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

