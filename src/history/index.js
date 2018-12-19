'use strict';

const StorageApi = require('../storageApi');
const FileManager = require('../FileManager');
const path = require('path');
const config = require('../../config');
const Logger = require('../logger');

class History {
    static async addHistoryToTestResults(opts) {
        Logger.log('Start add allure history to test results');

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

            Logger.log('Successfuly add allure history to test results');
        } catch (e) {
            console.error(`Error during adding allure history to test report, cause: ${e.message}`);
        }
    }
}

module.exports = History;
