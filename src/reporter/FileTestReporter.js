'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const config = require('../../config');
const Validator = require('../validation');
const uploader = require('../uploader');

class FileTestReporter extends BasicTestReporter {
    async start({ isUploadFile, extractedStorageConfig, isUpload }) {
        const buildData = await this.getBuildData();
        Validator.validateBuildData(buildData);

        this.showStartLogs({ buildId: this.buildId, isUpload, fileReporter: true });
        extractedStorageConfig.linkOnReport = this._buildLinkOnReport({ extractedStorageConfig, buildId: this.buildId, buildData });
        await this.exportVariables({
            extractedStorageConfig,
            uploadIndexFile: config.env.reportIndexFile,
            buildId: this.buildId,
            buildData
        });

        if (!isUploadFile) {
            Validator.validateRequiredVars(config.requiredVarsForUploadMode);
        }

        await Validator.validateUploadResource({
            isUploadFile,
            uploadIndexFile: config.env.reportIndexFile,
            dirForUpload: config.env.reportDir
        });

        const result = await uploader.uploadFiles({
            srcDir: config.env.reportDir,
            buildId: this.buildId,
            uploadFile: config.env.reportIndexFile,
            bucketName: config.env.bucketName,
            isUploadFile,
            extractedStorageConfig,
            buildData
        });

        return Promise.resolve({
            reportLink: extractedStorageConfig.linkOnReport,
            uploadedResource: isUploadFile ? config.env.reportIndexFile : config.env.reportDir,
            uploadResult: result,
            type: config.env.reportType
        });
    }
}

module.exports = FileTestReporter;
