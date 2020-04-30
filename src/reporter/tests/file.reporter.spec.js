const expect = require('chai').expect;
const fs = require('fs');
const ReporterTestUtils = require('./ReporterTestUtils');
const Config = require('../../../config');

const config = Config.getConfig();

describe('File reporter', function () {
    this.timeout(30000);
    const customReportDir = 'testUploadDir';
    const indexFile = 'test.txt';
    const fakeVolumeName = 'fakeVolume';

    after(async () => {
        ReporterTestUtils.clearAll({ customReportDir, reporter: 'file', volume: fakeVolumeName, config });
    });

    it('should upload custom test report', async () => {
        await ReporterTestUtils.clearAll({ customReportDir, reporter: 'file', config });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
            REPORT_INDEX_FILE: indexFile,
            REPORT_DIR: customReportDir
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initCustomTestResults({ customReportDir, indexFile });

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result.uploadResult).to.equal(true);
    });

    it('should upload one file', async () => {
        await ReporterTestUtils.clearAll({ customReportDir, reporter: 'file', config });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
            REPORT_INDEX_FILE: indexFile,
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initCustomTestResults({ customReportDir, indexFile });

        ReporterTestUtils.setEnvVariables({
            REPORT_INDEX_FILE: `${customReportDir}/${indexFile}`,
        });

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result.uploadResult).to.equal(true);
    });

    it('should remove test dir after upload', async () => {
        await ReporterTestUtils.clearAll({ customReportDir, reporter: 'file', config });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
            REPORT_INDEX_FILE: indexFile,
            REPORT_DIR: customReportDir,
            CLEAR_TEST_REPORT: true
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initCustomTestResults({ customReportDir, indexFile });

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result.uploadResult).to.equal(true);
        expect(fs.existsSync(customReportDir)).to.equal(false);
    });
});
