'use strict';

/* eslint consistent-return: 0 */

const { removeTestReportDir } = require('../FileManager');
const FileTestReporter = require('../reporter/FileTestReporter');
const AllureTestReporter = require('../reporter/AllureTestReporter');
const Config = require('../../config');

class SingleReportRunner {
    static async run(reporterData) {
        /**
         * From this point all execute flow get config from state, its because we need execute single runner few times
         * with different config
         */
        const config = Config.getConfig();
        config.uploadMaxSize = reporterData.uploadMaxSize;

        const state = {
            config,
            isUpload: SingleReportRunner.isUploadMode({ config }),
            ...reporterData,
        };

        state.isUploadFile = state.isUpload && !config.env.reportDir;

        try {
            let reporter;
            if (state.isUpload) {
                reporter = new FileTestReporter();
            } else {
                reporter = new AllureTestReporter();
            }

            const result = await reporter.start(state);

            await removeTestReportDir(state);

            return result;
        } catch (e) {
            await removeTestReportDir(state);

            /**
             * throw this error to upper scope
             */
            throw e;
        }
    }

    static isUploadMode({ config }) {
        if (config.env.allureDir) {
            return false;
        }

        return Object.values(config.requiredVarsForUploadMode).some((varValue) => {
            return !!varValue;
        });
    }
}

module.exports = SingleReportRunner;
