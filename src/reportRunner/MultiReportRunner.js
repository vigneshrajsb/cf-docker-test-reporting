'use strict';

const FileManager = require('../FileManager');
const Config = require('../../config');
const Logger = require('../logger');

class MultiReportRunner {
    static async run(reporterData) {
        let uploadReportPromise = Promise.resolve();
        const uploadedReports = [];

        Logger.log('START UPLOAD MULTIPLE REPORTS');

        reporterData.config.forEach(async (config) => {
            uploadReportPromise = uploadReportPromise.then(async () => {
                const SingleReportRunner = require('./SingleReportRunner.js');
                const result = await SingleReportRunner.run({ ...reporterData, config  });

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

    static async uploadReportsIndexDir({ uploadedReports, reporterData }) {
        const config = Config.getConfig({
            reportDir: reporterData.config[0].reportsIndexDir,
            reportIndexFile: 'index.html',
        });

        const indexDirPath = config.reportsIndexDir;

        await FileManager.createFile({
            filePath: `${indexDirPath}/reports.js`,
            fileData: `window.reports = ${JSON.stringify(uploadedReports)}`,
            opts: { force: true }
        });

        const SingleReportRunner = require('./SingleReportRunner.js');
        const { reportLink } = await SingleReportRunner.run({ ...reporterData, config });

        Logger.log('All reports was uploaded, you can access it on');
        Logger.log(reportLink);
    }
}

module.exports = MultiReportRunner;

