'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const config = require('../../config');
const allureCmd = require('../../cf-allure-commandline/index');
const validator = require('../validation');
const uploader = require('../uploader');
const History = require('../history');
const Logger = require('../logger');

class AllureTestReporter extends BasicTestReporter {
    generateReport() {
        return allureCmd(['generate', config.env.sourceReportFolderName, '--clean']);
    }

    async start({ extractedStorageConfig, isUpload }) {
        const buildData = await this.getBuildData();
        validator.validateBuildData(buildData);

        await this.exportVariables({
            extractedStorageConfig,
            isUpload,
            buildId: this.buildId,
            buildData
        });

        await validator.validateUploadDir(config.env.sourceReportFolderName);

        /**
         * download allure history from storage and insert it to test results dir
         * for make available history view in test report
         */
        await History.addHistoryToTestResults({
            extractedStorageConfig,
            bucketName: config.env.bucketName,
            buildData
        });

        const generation = this.generateReport();
        return new Promise(async (res, rej) => {
            generation.on('exit', async (exitCode) => {
                if (exitCode !== 0) {
                    rej(new Error(`Report generation is fail, exit with code: ${exitCode}`));
                }

                console.log('Report generation is finished successfully');

                try {
                    /**
                     * upload allure history to storage for use it before next report generation
                     */
                    await uploader.uploadFiles({
                        srcDir: `${config.resultReportFolderName}/${config.allureHistoryDir}`,
                        bucketName: config.env.bucketName,
                        extractedStorageConfig,
                        buildData,
                        uploadHistory: true
                    }).catch((e) => {
                        Logger.log(
                            'Allure history has not been uploaded, current test build wouldn`t be available in the report \n' +
                            `cause: ${e.message}`
                        );
                    });

                    const result = uploader.uploadFiles({
                        srcDir: config.resultReportFolderName,
                        buildId: this.buildId,
                        bucketName: config.env.bucketName,
                        extractedStorageConfig,
                        buildData
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
