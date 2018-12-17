'use strict';

const StorageApi = require('../storageApi');
const FileManager = require('../FileManager');
const path = require('path');
const config = require('../../config');

class History {
    static async addHistoryToTestResults(opts) {
        console.log(
            config.colors.aqua,
            'Start add allure history to test results',
            config.colors.none
        );
        /**
         * download history files to tmp dir and after success rename tmp history dir
         * this need for make sure that history will be correct
         */
        const historyDirBase = `${path.resolve(config.env.sourceReportFolderName)}`;
        const tmpHistoryFullPath = `${historyDirBase}/tmp_${config.allureHistoryDir}`;

        try {
            await FileManager.createDir(tmpHistoryFullPath, { force: true });
            await StorageApi.getApi(opts).downloadHistory(Object.assign(opts, { historyDir: tmpHistoryFullPath }));
            await FileManager.renameDir(tmpHistoryFullPath, `${historyDirBase}/${config.allureHistoryDir}`, { force: true });

            console.log(
                config.colors.aqua,
                'Successfuly add allure history to test results',
                config.colors.none
            );
        } catch (e) {
            console.log(
                config.colors.aqua,
                `Error during adding allure history to test report, cause: ${e.message}`,
                config.colors.none
            );
        }
    }
}

module.exports = History;
