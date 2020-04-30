const FileManager = require('../FileManager');
const Config = require('../../config');
const Logger = require('../logger');
const SingleReportRunner = require('./SingleReportRunner.js');

class MultiReportRunner {
    static async run(reporterData) {
        Logger.log('START UPLOAD MULTIPLE REPORTS');

        const reports = reporterData.config.map(async config => SingleReportRunner.run({ ...reporterData, config  }));

        const uploadedReports = await Promise.all(reports);

        /**
         * upload entry page contains list of uploaded reports
         */
        return MultiReportRunner.uploadReportsIndexDir({ uploadedReports, reporterData });
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

        const { reportLink } = await SingleReportRunner.run({ ...reporterData, config });

        Logger.log('All reports was uploaded, you can access it on');
        Logger.log(reportLink);

        return { reportLink };
    }
}

module.exports = MultiReportRunner;

