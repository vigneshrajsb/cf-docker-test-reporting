'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const config = require('../config');
const allureCmd = require('../cf-allure-commandline');

class AllureTestReporter extends  BasicTestReporter {
    generateReport() {
        return allureCmd(['generate', config.sourceReportFolderName, '--clean']);
    }

    async start() {
        await this.prepareForGenerateReport();

        await this.validateUploadDir(config.sourceReportFolderName);

        console.log(`Start generating visualization of test report for build ${this.buildId}`);
        const generation = this.generateReport();
        generation.on('exit', async (exitCode) => {
            if (exitCode === 0) {
                console.log('Report generation is finished successfully');
            } else {
                throw new Error(`Report generation is fail, exit with code: ${exitCode}`);
            }

            await this.uploadFiles({ srcDir: config.resultReportFolderName, bucket: this.bucket, buildId: this.buildId });
        });
    }
}

module.exports = AllureTestReporter;
