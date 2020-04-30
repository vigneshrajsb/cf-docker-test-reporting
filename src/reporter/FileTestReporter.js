'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const Validator = require('../validation');
const uploader = require('../uploader');

class FileTestReporter extends BasicTestReporter {
    async start(state) {
        const { isUploadFile, config } = state;
        await this.addBuildData(state);
        Validator.validateBuildData(state);

        this.showStartLogs(state, true);
        state.linkOnReport = this._buildLinkOnReport(state);
        await this.exportVariables(state);

        if (!isUploadFile) {
            Validator.validateRequiredVars(state);
        }

        await Validator.validateUploadResource(state, config.env.reportDir);

        const result = await uploader.uploadFiles(state, {
            srcDir: config.env.reportDir,
        });

        return Promise.resolve({
            reportLink: state.linkOnReport,
            uploadedResource: isUploadFile ? config.env.reportIndexFile : config.env.reportDir,
            uploadResult: result,
            type: config.env.reportType
        });
    }
}

module.exports = FileTestReporter;
