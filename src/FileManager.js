/* eslint consistent-return: 0 */

const recursiveReadSync = require('recursive-readdir-sync');
const fs = require('fs');
const rimraf = require('rimraf');
const getSize = require('get-folder-size');

const FULL_USER_PERMISSION = '0744';

class FileManager {
    static getDirOrFileSize(pathToResource) {
        return new Promise((res) => {
            if (fs.statSync(pathToResource).isDirectory()) {
                getSize(pathToResource, (err, size) => {
                    if (err) {
                        throw err;
                    }
                    res(size / 1024 / 1024);
                });
            } else {
                res(fs.statSync(pathToResource).size / 1024 / 1024);
            }
        });
    }

    static _getFilesForUpload({ srcDir, uploadFile, isUploadFile }) {
        if (!isUploadFile) {
            return recursiveReadSync(srcDir);
        }
        return [uploadFile];
    }

    static removeTestReportDir({ isUpload, config }) {
        let folderForRemove;

        if (!isUpload || (config.env.clearTestReport && config.env.reportDir)) {
            folderForRemove = config.env.reportDir || config.env.sourceReportFolderName;
        }

        if (folderForRemove) {
            return new Promise((res) => {
                console.log('Start removing test report folder');
                rimraf.sync(folderForRemove);
                res(true);
            });
        }
    }

    static removeResource(path) {
        return new Promise((res, rej) => {
            try {
                rimraf.sync(path);
                res(path);
            } catch (e) {
                rej(e);
            }
        });
    }

    static createDir(path, opts = {}, flags = {}) {
        return Promise.resolve()
            .then(() => {
                if (opts.force) {
                    return FileManager.removeResource(path);
                }
            })
            .then(() => {
                return new Promise((res, rej) => {
                    fs.mkdir(path, Object.assign({ mode: FULL_USER_PERMISSION }, flags), (err) => {
                        if (err) {
                            rej(err);
                        }

                        res(path);
                    });
                });
            });
    }

    static renameDir(from, to, opts = {}) {
        return Promise.resolve()
            .then(() => {
                if (opts.force) {
                    return FileManager.removeResource(to);
                }
            })
            .then(() => {
                return new Promise((res, rej) => {
                    fs.rename(from, to, (err) => {
                        if (err) {
                            rej(err);
                        }

                        res(to);
                    });
                });
            });
    }

    static createFile({ filePath, fileData, opts = {}, flags }) {
        return Promise.resolve()
            .then(() => {
                if (opts.force) {
                    return FileManager.removeResource(filePath);
                }
            })
            .then(() => {
                return new Promise((res, rej) => {
                    fs.writeFile(filePath, fileData, Object.assign({ mode: FULL_USER_PERMISSION }, flags), (err) => {
                        if (err) {
                            rej(err);
                        }

                        res(filePath);
                    });
                });
            });
    }
}

module.exports = FileManager;
