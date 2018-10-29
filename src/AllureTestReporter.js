'use strict';

const BasicTestReporter = require('./BasicTestReporter');
const config = require('../config');
const allureCmd = require('../cf-allure-commandline');
const fileManager = require('./FileManager');

class AllureTestReporter extends  BasicTestReporter {
    generateReport() {
        return allureCmd(['generate', config.sourceReportFolderName, '--clean']);
    }

    async start() {
        await this.prepareForGenerateReport();

        await fileManager.validateUploadDir(config.sourceReportFolderName);

        console.log(`Start generating visualization of test report for build ${this.buildId}`);
        const generation = this.generateReport();
        return new Promise(async (res, rej) => {
            generation.on('exit', async (exitCode) => {
                if (exitCode !== 0) {
                    rej(new Error(`Report generation is fail, exit with code: ${exitCode}`));
                }

                console.log('Report generation is finished successfully');

                try {
                    const result = await fileManager.uploadFiles({
                        srcDir: config.resultReportFolderName,
                        bucket: this.bucket,
                        buildId: this.buildId
                    });
                    res(result);
                } catch (e) {
                    rej(e);
                }
            });
        });
    }
}

module.exports = AllureTestReporter;
