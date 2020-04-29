'use strict';

const expect = require('chai').expect;
const FileManager = require('../../FileManager');
const fs = require('fs');
const ReporterTestUtils = require('./ReporterTestUtils');
const Config = require('../../../config');

const config = Config.getConfig();

describe('Allure Reporter', function () {
    const customAllureResults = 'test_allure_results';
    const fakeVolumeName = 'fakeVolume';

    this.timeout(30000);

    after(async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure', volume: fakeVolumeName, config });
        await FileManager.removeResource(customAllureResults);
    });

    it('should generate and upload allure report', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure', config });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initAllureTestResults(config.env.sourceReportFolderName);

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result.uploadResult).to.equal(true);
    });

    it('should generate and upload allure report with custom name', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure', config });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
            ALLURE_DIR: customAllureResults
        });

        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initAllureTestResults(customAllureResults);

        const reporterRunner = require('../../reportRunner');
        const result = await reporterRunner.run();
        expect(result.uploadResult).to.equal(true);
    });

    it('should remove test dir after upload', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure', config });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName,
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initAllureTestResults(config.env.sourceReportFolderName);

        const reporterRunner = require('../../reportRunner');
        await reporterRunner.run();
        expect(fs.existsSync(config.env.sourceReportFolderName)).to.equal(false);
    });

    it('should add history to test results', async () => {
        await ReporterTestUtils.clearAll({ reporter: 'allure', config });
        ReporterTestUtils.setEnvVariables({
            CF_VOLUME_PATH: fakeVolumeName
        });
        await ReporterTestUtils.initVolume();

        await ReporterTestUtils.initAllureTestResults(config.env.sourceReportFolderName);

        /**
         * Mock method by rewrite require cache
         */
        const FileMan = require('../../FileManager');
        FileMan.removeTestReportDir = () => {
            Promise.resolve();
        };

        ReporterTestUtils.clearRequireCache();

        require('../../FileManager.js');

        require.cache[require.resolve('../../FileManager.js')].exports = FileMan;

        const reporterRunner = require('../../reportRunner');
        await reporterRunner.run();

        expect(fs.existsSync(`${config.env.sourceReportFolderName}/${config.allureHistoryDir}`)).to.equal(true);
        expect(fs.readdirSync(`${config.env.sourceReportFolderName}/${config.allureHistoryDir}`).length > 0).to.equal(true);
    });
});
