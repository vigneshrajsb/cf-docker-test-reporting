'use strict';

/* eslint consistent-return: 0 */

const { removeTestReportDir } = require('../FileManager');
const BasicTestReporter = require('../reporter/BasicTestReporter');
const FileTestReporter = require('../reporter/FileTestReporter');
const AllureTestReporter = require('../reporter/AllureTestReporter');
const config = require('../../config');

const basicTestReporter = new BasicTestReporter();

class SingleReportRunner {
    static async run(reporterData) {
        let isUpload;

        try {
            isUpload = basicTestReporter.isUploadMode(config.requiredVarsForUploadMode);

            let reporter;
            if (isUpload) {
                reporter = new FileTestReporter();
            } else {
                reporter = new AllureTestReporter();
            }

            const result = await reporter.start(Object.assign(reporterData, {
                isUploadFile: !config.env.reportDir,
                isUpload
            }));

            await removeTestReportDir();

            return result;
        } catch (e) {
            await removeTestReportDir();

            /**
             * throw this error to upper scope
             */
            throw e;
        }
    }
}

module.exports = SingleReportRunner;
