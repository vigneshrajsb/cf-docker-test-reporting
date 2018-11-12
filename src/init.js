'use strict';

/* eslint consistent-return: 0 */

const { removeTestReportDir } = require('./FileManager');
const BasicTestReporter = require('./BasicTestReporter');
const storageConfigManager = require('./StorageConfigManager');
const FileTestReporter = require('./FileTestReporter');
const AllureTestReporter = require('./AllureTestReporter');
const config = require('../config');
const fs = require('fs');

const basicTestReporter = new BasicTestReporter();

async function init() {
    let isUpload;

    try {
        storageConfigManager.validateStorageConfig();

        const { type, name: contextName, storageConfig } = storageConfigManager.extractStorageConfigFromVar();
        if (type === 'json') {
            fs.writeFileSync(config.googleStorageConfig.keyFilename, JSON.stringify(storageConfig));
        }

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

        if (contextName) {
            await basicTestReporter.setExportVariable('TEST_REPORT_USED_CONTEXT', contextName);
        }

        const result = await reporter.start(!process.env.REPORT_DIR);

        await removeTestReportDir();

        return result;
    } catch (e) {
        await removeTestReportDir();

        console.error(e.message);
        process.exit(1);
    }
}

module.exports = init;

