'use strict';

const recursiveReadSync = require('recursive-readdir-sync');
const Exec = require('child_process').exec;
const fs = require('fs');
const config = require('../config');

class FileManager {
    static async uploadFiles({ srcDir, bucket, buildId }) {
        return new Promise(async (res, rej) => {
            try {
                const files = await recursiveReadSync(srcDir);

                console.log('Start upload report files');

                const uploadPromises = files.map((f) => {
                    const pathWithoutSrcDir = f.replace(srcDir, '');
                    const pathToDeploy = buildId + (pathWithoutSrcDir.startsWith('/') ? pathWithoutSrcDir : `/${pathWithoutSrcDir}`);

                    return new Promise((resolve, reject) => {
                        bucket.upload(f, { destination: pathToDeploy }, (err) => {
                            if (err) {
                                console.error(`Fail to upload file ${pathToDeploy}, error: `, err.message ? err.message : err);
                                reject(new Error('Fail to upload file'));
                            } else {
                                console.log(`File ${pathToDeploy} successful uploaded`);
                                resolve(true);
                            }
                        });
                    });
                });

                Promise.all(uploadPromises).then(() => {
                    console.log(`All report files was successfully uploaded.
You can access it on https://g.codefresh.io/api/testReporting/${buildId}/${process.env.REPORT_INDEX_FILE || 'index.html'}`);
                    res(true);
                }, (err) => { rej(err); });
            } catch (err) {
                rej(new Error(`Error while uploading files: ${err.message || 'Unknown error'}`));
            }
        });
    }

    static getDirSize(pathToDir) {
        return new Promise((res) => {
            Exec(`du -sk ${pathToDir}`, (err, response) => {
                const match = response.trim().match(/^[\d\.\,]+/);

                if (!match) {
                    res(null);
                }

                res(parseInt(match.toString().trim()) / 1024);
            });
        });
    }

    static async validateUploadDir(pathToDir) {
        if (!fs.existsSync(pathToDir)) {
            throw new Error(`Error: Directory for upload does not exist. 
Ensure that "working_directory" was specified for this step and it contains the directory for upload`);
        }

        if (!fs.readdirSync(pathToDir).length) {
            throw new Error('Error: Directory for upload is empty');
        }

        if (config.directoryForUploadMaxSize < await this.getDirSize(pathToDir)) {
            throw new Error(`Error: Directory for upload is to large, max size is ${config.directoryForUploadMaxSize} MB`);
        }

        return true;
    }

    static removeTestReportDir(pathToDir) {
        return new Promise((res) => {
            console.log('Start removing test report folder (we need clear test report on each build for avoid some bugs)');
            Exec(`rm -rf ${pathToDir}`, (err) => {
                if (err) {
                    console.error(`Cant remove report folder "${pathToDir}", cause: ${err.message ? err.message : 'unknown error'}`);
                } else {
                    console.log(`Test report folder "${pathToDir}" has been removed`);
                }

                res(true);
            });
        });
    }
}

module.exports = FileManager;
