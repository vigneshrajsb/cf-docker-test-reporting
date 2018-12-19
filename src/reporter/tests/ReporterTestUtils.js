'use strict';

const FileManager = require('../../FileManager');
const config = require('../../../config');

class ReporterTestUtils {
    static setEnvVariables(varsObj) {
        Object.keys(varsObj).forEach((key) => {
            process.env[key] = varsObj[key];
        });
    }

    static async initVolume(customVolumePath) {
        /**
         * reporter exported variables by him writing to file, need to mock that file for avoid write error
         */
        const volumePath = customVolumePath || process.env.CF_VOLUME_PATH;

        return FileManager.createDir(volumePath, { force: true })
            .then(() => {
                return FileManager.createFile({
                    filePath: `${volumePath}/env_vars_to_export`,
                    fileData: '',
                    opts: { force: true }
                });
            });
    }

    static clearEnvVariables() {
        delete process.env.CLEAR_TEST_REPORT;
        delete process.env.REPORT_DIR;
        delete process.env.REPORT_INDEX_FILE;
    }

    static async clearAll({ customReportDir, reporter, volume } = {}) {
        /**
         * sourceReportDir - custom name for allure-results
         * customReportDir - name of custom upload directory
         * reporter - reporter type (allure or file), on report type depends how clear upload resources
         * volume - name of fake volume name to be clear
         */

        ReporterTestUtils.clearEnvVariables();
        ReporterTestUtils.clearRequireCache();

        if (reporter === 'allure') {
            await FileManager.removeResource(`${process.cwd()}/${config.resultReportFolderName}`);
            await FileManager.removeResource(`${process.cwd()}/${config.env.sourceReportFolderName}`);
        } else if (reporter === 'file') {
            await FileManager.removeResource(`${customReportDir}`);
        } else {
            throw new Error('Unknown reporter, you must specify which reporter was used');
        }

        if (volume) {
            await FileManager.removeResource(`${volume}`);
        }
    }

    static clearRequireCache() {
        /**
         * need to clear modules cache before each test, because in each test we redefine config module
         * and he must be refresh in other modules which use it
         */

        delete require.cache[require.resolve('../../../config')];
        delete require.cache[require.resolve('../BasicTestReporter.js')];
        delete require.cache[require.resolve('../AllureTestReporter.js')];
        delete require.cache[require.resolve('../../init')];
        delete require.cache[require.resolve('../../FileManager.js')];
        delete require.cache[require.resolve('../../history/index.js')];
    }

    static initAllureTestResults(resultsDir) {
        /**
         * create dir with allure results
         */

        return FileManager.createDir(resultsDir, { force: true })
            .then(() => {
                return FileManager.createFile({
                    filePath: `${resultsDir}/0959780b-46b0-4731-9202-71bf34433d1c-testsuite.xml`,
                    fileData: `<?xml version='1.0'?>
<ns2:test-suite xmlns:ns2='urn:model.allure.qatools.yandex.ru' start='1536739453738' stop='1536739455242'>
    <name>sanity tests</name>
    <title>sanity tests</title>
    <test-cases>
        <test-case start='1536739453739' status='passed' stop='1536739455240'>
            <name>test mongo connection</name>
            <title>test mongo connection</title>
            <labels/>
            <parameters/>
            <steps/>
            <attachments/>
        </test-case>
    </test-cases>
</ns2:test-suite>`,
                    opts: { force: true }
                });
            });
    }

    static initCustomTestResults({ customReportDir, indexFile }) {
        /**
         * create cutsom dir for upload
         */
        return FileManager.createDir(customReportDir, { force: true })
            .then(() => {
                return FileManager.createFile({
                    filePath: `${customReportDir}/${indexFile}`,
                    fileData: 'test'.repeat(10),
                    opts: { force: true }
                });
            });
    }
}

module.exports = ReporterTestUtils;
