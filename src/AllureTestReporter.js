'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const config = require('../config');
const allureCmd = require('../cf-allure-commandline');
const fileManager = require('./FileManager');
const gcs = require('@google-cloud/storage')(config.googleStorageConfig);
const uploaders = require('./uploaders');

class AllureTestReporter extends  BasicTestReporter {
    generateReport() {
        return allureCmd(['generate', config.sourceReportFolderName, '--clean']);
    }

    async start({ extractedStorageConfig }) {
        await this.prepareForGenerateReport();

        await fileManager.validateUploadDir(config.sourceReportFolderName);

        console.log(`Start generating visualization of test report for build ${this.buildId}`);
        const generation = this.generateReport();
        return new Promise(async (res, rej) => {
            generation.on('exit', async (exitCode) => {
                if (exitCode !== 0) {
                    rej(new Error(`Report generation is fail, exit with code: ${exitCode}`));
                }

                console.log('Report generation is finished successfully');

                try {
                    const uploader = uploaders[extractedStorageConfig.integrationType];

                    const result = uploader.upload({
                        srcDir: config.resultReportFolderName,
                        bucket: gcs.bucket(config.bucketName),
                        buildId: this.buildId,
                        extractedStorageConfig
                    });
                    res(result);
                } catch (e) {
                    rej(e);
                }
            });
        });
    }
}

module.exports = AllureTestReporter;
