'use strict';

const BasicTestReporter = require('./reporter/BasicTestReporter');
const recursiveReadSync = require('recursive-readdir-sync');
const Exec = require('child_process').exec;
const config = require('../config');

const basicTestReporter = new BasicTestReporter();

class FileManager {
    static getDirOrFileSize(pathToResource) {
        return new Promise((res) => {
            Exec(`du -sk ${pathToResource}`, (err, response) => {
                const match = response.trim().match(/^[\d.,]+/);

                if (!match) {
                    res(null);
                }

                res(parseInt(match.toString().trim(), 10) / 1024);
            });
        });
    }

    static _getFilesForUpload({ srcDir, uploadFile, isUploadFile }) {
        if (!isUploadFile) {
            return recursiveReadSync(srcDir);
        } else {
            return [uploadFile];
        }
    }

    static removeTestReportDir() {
        let folderForRemove;

        const isUpload = basicTestReporter.isUploadMode(config.requiredVarsForUploadMode);

        if (!isUpload || (process.env.CLEAR_TEST_REPORT && process.env.REPORT_DIR)) {
            folderForRemove = process.env.REPORT_DIR || config.sourceReportFolderName;
        }

        if (folderForRemove) {
            return new Promise((res) => {
                console.log('Start removing test report folder');
                Exec(`rm -rf ${folderForRemove}`, (err) => {
                    if (err) {
                        console.error(`Cant remove report folder "${folderForRemove}", cause: 
                        ${err.message ? err.message : 'unknown error'}`);
                    } else {
                        console.log(`Test report folder "${folderForRemove}" has been removed`);
                    }

                    res(true);
                });
            });
        }

        return Promise.resolve();
    }
}

module.exports = FileManager;
