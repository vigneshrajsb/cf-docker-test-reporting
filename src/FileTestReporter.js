'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const config = require('../config');
const fileManager = require('./FileManager');

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
    async start() {
        console.log('Start upload custom test report (without generating visualization of test report)');
        console.log('REPORT_DIR: ', this.dirForUpload);
        console.log('REPORT_INDEX_FILE: ', this.uploadIndexFile);

        await this.prepareForGenerateReport();

        await this.setExportVariable('TEST_REPORT_UPLOAD_INDEX_FILE', this.uploadIndexFile);

        const missingVars = this.findMissingVars(config.requiredVarsForUploadMode);
        if (missingVars.length) {
            throw new Error(`For upload custom test report you must specify ${missingVars.join(', ')} variable${missingVars.length > 1 ? 's' : ''}`);
        }

        await fileManager.validateUploadDir(this.dirForUpload);

        return fileManager.uploadFiles({
            srcDir: this.dirForUpload,
            bucket: this.bucket,
            buildId: this.buildId
        });
    }
}

module.exports = FileTestReporter;
