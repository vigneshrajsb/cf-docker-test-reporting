'use strict';

const expect = require('chai').expect;
const FileManager = require('../../FileManager');
const fs = require('fs');
const ReporterTestUtils = require('./ReporterTestUtils');

describe('Allure Reporter', function () {
    const customAllureResults = 'test_allure_results';
    const fakeVolumeName = 'fakeVolume';

    this.timeout(30000);

    after(async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure', volume: fakeVolumeName });
        await FileManager.removeResource(customAllureResults);
    });

    it('should generate and upload allure report', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure' });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
        });
        await ReporterTestUtils.initVolume();

        const conf = require('../../../config');

        await ReporterTestUtils.initAllureTestResults(conf.env.sourceReportFolderName);

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result).to.equal(true);
    });

    it('should generate and upload allure report with custom name', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure' });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
            ALLURE_DIR: customAllureResults
        });
        const conf = require('../../../config');

        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initAllureTestResults(conf.env.sourceReportFolderName);

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result).to.equal(true);
    });

    it('should remove test dir after upload', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure' });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
        });
        await ReporterTestUtils.initVolume();

        const conf = require('../../../config');

        await ReporterTestUtils.initAllureTestResults(conf.env.sourceReportFolderName);

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result).to.equal(true);
        expect(fs.existsSync(conf.env.sourceReportFolderName)).to.equal(false);
    });

    it('should remove test dir after upload', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure' });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
        });
        await ReporterTestUtils.initVolume();

        const conf = require('../../../config');

        await ReporterTestUtils.initAllureTestResults(conf.env.sourceReportFolderName);

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result).to.equal(true);
        expect(fs.existsSync(conf.env.sourceReportFolderName)).to.equal(false);
    });

    it('should add history to test results', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure' });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName
        });
        await ReporterTestUtils.initVolume();

        const conf = require('../../../config');

        await ReporterTestUtils.initAllureTestResults(conf.env.sourceReportFolderName);

        /**
         * Mock method by rewrite require cache
         */
        const FileMan = require('../../FileManager');
        FileMan.removeTestReportDir = () => {
            Promise.resolve();
        };

        require.cache[require.resolve('../../FileManager')].exports = FileMan;

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result).to.equal(true);
        expect(fs.existsSync(`${conf.env.sourceReportFolderName}/${conf.allureHistoryDir}`)).to.equal(true);
        expect(fs.readdirSync(`${conf.env.sourceReportFolderName}/${conf.allureHistoryDir}`).length > 0).to.equal(true);
    });
});
