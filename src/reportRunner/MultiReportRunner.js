'use strict';

const ReporterTestUtils = require('../reporter/tests/ReporterTestUtils');
const FileManager = require('../FileManager');
const Config = require('../../config');
const _ = require('lodash');
const Logger = require('../logger');

const config = Config.getConfig();

class MultiReportRunner {
    static async run(reporterData) {
        let uploadReportPromise = Promise.resolve();
        const uploadedReports = [];

        Logger.log('START UPLOAD MULTIPLE REPORTS');

        config.env.multiReportUpload.forEach(async (uploadVars, index) => {
            uploadReportPromise = uploadReportPromise.then(async () => {
                /**
                 * since we use single runner for handle each report we must clear all modules cache and env vars
                 * related to upload specific report before start handle report
                 */
                ReporterTestUtils.clearEnvVariables({ config });

                /**
                 * REPORT_WRAP_DIR - name of folder in which will be uploaded files
                 * by existing this var reporter know that multireports uploads now
                 */
                uploadVars.REPORT_WRAP_DIR = index;
                MultiReportRunner.setUploadVars(uploadVars);

                const SingleReportRunner = require('./SingleReportRunner.js');
                const result = await SingleReportRunner.run(reporterData);

                uploadedReports.push(result);

                return result;
            });
        });

        await uploadReportPromise;

        /**
         * upload entry page contains list of uploaded reports
         */
        await MultiReportRunner.uploadReportsIndexDir({ uploadedReports, reporterData });

        return true;
    }

    static setUploadVars(uploadVars) {
        const posibleVarsForUpload = config.uploadArrayVars;
        const varsToSet = {};

        posibleVarsForUpload.forEach((varName) => {
            if (uploadVars[varName]) {
                varsToSet[varName] = uploadVars[varName];
            }
        });

        if (_.isNumber(uploadVars.REPORT_WRAP_DIR)) {
            varsToSet.REPORT_WRAP_DIR = uploadVars.REPORT_WRAP_DIR;
        }

        ReporterTestUtils.setEnvVariables(varsToSet);
    }

    static async uploadReportsIndexDir({ uploadedReports, reporterData }) {
        const indexDirPath = `${process.cwd()}/${config.reportsIndexDir}`;

        await FileManager.createFile({
            filePath: `${indexDirPath}/reports.js`,
            fileData: `window.reports = ${JSON.stringify(uploadedReports)}`,
            opts: { force: true }
        });

        ReporterTestUtils.clearEnvVariables({ config });

        MultiReportRunner.setUploadVars({
            REPORT_INDEX_FILE: 'index.html',
            REPORT_DIR: config.reportsIndexDir
        });

        const SingleReportRunner = require('./SingleReportRunner.js');
        const { reportLink } = await SingleReportRunner.run(reporterData);

        Logger.log('All reports was uploaded, you can access it on');
        Logger.log(reportLink);
    }
}

module.exports = MultiReportRunner;

