'use strict';

/* eslint global-require: 0 */

const expect = require('chai').expect;
const fs = require('fs');
const ReporterTestUtils = require('./ReporterTestUtils');

describe('File reporter', function () {
    this.timeout(30000);
    const customReportDir = 'testUploadDir';
    const indexFile = 'test.txt';
    const fakeVolumeName = 'fakeVolume';

    after(async () => {
        ReporterTestUtils.clearAll({ customReportDir, reporter: 'file', volume: fakeVolumeName });
    });

    it('should upload custom test report', async () => {
        await ReporterTestUtils.clearAll({ customReportDir, reporter: 'file' });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
            REPORT_INDEX_FILE: indexFile,
            REPORT_DIR: customReportDir
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initCustomTestResults({ customReportDir, indexFile });

        const initReporter = require('../../init');
        const result = await initReporter();
        expect(result).to.equal(true);
    });

    it('should upload one file', async () => {
        await ReporterTestUtils.clearAll({ customReportDir, reporter: 'file' });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
            REPORT_INDEX_FILE: indexFile,
            REPORT_DIR: customReportDir
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initCustomTestResults({ customReportDir, indexFile });

        ReporterTestUtils.setEnvVariables({
            REPORT_INDEX_FILE: `${customReportDir}/${indexFile}`,
        });

        delete process.env.REPORT_DIR;

        ReporterTestUtils.clearRequireCache();

        const initReporter = require('../../init');
        const result = await initReporter();
        expect(result).to.equal(true);
    });

    it('should remove test dir after upload', async () => {
        await ReporterTestUtils.clearAll({ customReportDir, reporter: 'file' });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
            REPORT_INDEX_FILE: indexFile,
            REPORT_DIR: customReportDir,
            CLEAR_TEST_REPORT: true
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initCustomTestResults({ customReportDir, indexFile });

        const initReporter = require('../../init');
        const result = await initReporter();
        expect(result).to.equal(true);
        expect(fs.existsSync(customReportDir)).to.equal(false);
    });
});
