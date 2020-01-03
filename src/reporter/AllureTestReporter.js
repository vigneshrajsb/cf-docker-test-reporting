'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const allureCmd = require('../../cf-allure-commandline/index');
const Validator = require('../validation');
const uploader = require('../uploader');
const History = require('../history');
const Logger = require('../logger');

class AllureTestReporter extends BasicTestReporter {

    generateReport({ config }) {
        return allureCmd(['generate', config.env.sourceReportFolderName, '--clean']);
    }

    async start(state) {
        const { config } = state;
        await this.addBuildData(state);
        Validator.validateBuildData(state);

        this.showStartLogs(state);
        state.linkOnReport = this._buildLinkOnReport(state);

        await this.exportVariables(state);

        await Validator.validateUploadDir(state, config.env.sourceReportFolderName);

        /**
         * download allure history from storage and insert it to test results dir
         * for make available history view in test report
         */
        await History.addHistoryToTestResults(state);

        const generation = this.generateReport(state);
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
                    await uploader.uploadFiles(state, {
                        srcDir: `${config.resultReportFolderName}/${config.allureHistoryDir}`,
                        uploadHistory: true
                    }).catch((e) => {
                        Logger.log(
                            'Allure history has not been uploaded, current test build wouldn`t be available in the report \n' +
                            `cause: ${e.message}`
                        );
                    });

                    const result = await uploader.uploadFiles(state, {
                        srcDir: config.resultReportFolderName,
                    });
                    console.log(state.linkOnReport);

                    res({
                        reportLink: state.linkOnReport,
                        uploadedResource: config.resultReportFolderName,
                        uploadResult: result,
                        type: config.env.reportType
                    });
                } catch (e) {
                    rej(e);
                }
            });
        });
    }
}

module.exports = AllureTestReporter;
