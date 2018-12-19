'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const config = require('../../config');
const validator = require('../validation');
const uploader = require('../uploader');

class FileTestReporter extends BasicTestReporter {
    constructor({
                    dirForUpload = process.env.REPORT_DIR,
                    uploadIndexFile = process.env.REPORT_INDEX_FILE,
                } = {}
                ) {
        super();
        this.dirForUpload = typeof dirForUpload === 'string' ? dirForUpload.trim() : dirForUpload;
        this.uploadIndexFile = typeof uploadIndexFile === 'string' ? uploadIndexFile.trim() : uploadIndexFile;
    }
    async start({ isUploadFile, extractedStorageConfig, isUpload }) {
        console.log('REPORT_DIR: ', this.dirForUpload);
        console.log('REPORT_INDEX_FILE: ', this.uploadIndexFile);

        const buildData = await this.getBuildData();
        validator.validateBuildData(buildData);

        await this.exportVariables({
            extractedStorageConfig,
            uploadIndexFile: this.uploadIndexFile,
            isUpload,
            buildId: this.buildId,
            buildData
        });

        if (!isUploadFile) {
            const missingVars = this.findMissingVars(config.requiredVarsForUploadMode);
            if (missingVars.length) {
                throw new Error(`For upload custom test report you must specify:
${missingVars.join(', ')} variable${missingVars.length > 1 ? 's' : ''}`);
            }
        }

        await validator.validateUploadResource({
            isUploadFile,
            uploadIndexFile: this.uploadIndexFile,
            dirForUpload: this.dirForUpload
        });

        return uploader.uploadFiles({
            srcDir: this.dirForUpload,
            buildId: this.buildId,
            uploadFile: this.uploadIndexFile,
            bucketName: config.env.bucketName,
            isUploadFile,
            extractedStorageConfig,
            buildData
        });
    }
}

module.exports = FileTestReporter;
