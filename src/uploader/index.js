'use strict';

const FileManager = require('../FileManager');
const path = require('path');
const config = require('../../config');
const StorageApi = require('../storageApi');
const Logger = require('../logger');

const FORBIDDEN_STATUS = 403;

class Uploader {
    static async uploadFiles({
                                 srcDir,
                                 buildId,
                                 bucketName,
                                 uploadFile,
                                 isUploadFile,
                                 extractedStorageConfig,
                                 buildData,
                                 uploadHistory
    }) {
        logStartUploadFiles({ uploadHistory });
        return new Promise(async (res, rej) => {
            try {
                const files = await FileManager._getFilesForUpload({ srcDir, uploadFile, isUploadFile });

                const uploadPromises = files.map((file) => {
                    const pathToDeploy = this._getFilePathForDeploy({
                        file,
                        buildId,
                        srcDir,
                        isUploadFile,
                        uploadFile,
                        buildData,
                        uploadHistory
                    });

                    return this._uploadFileWithRetry({
                        file,
                        pathToDeploy,
                        bucketName,
                        retryCount: config.uploadRetryCount,
                        extractedStorageConfig,
                        uploadHistory
                    });
                });

                Promise.all(uploadPromises).then(() => {
                    logSuccessUploadFiles({ extractedStorageConfig, uploadHistory });
                    res(true);
                }, (err) => { rej(err); });
            } catch (err) {
                rej(new Error(`Error while uploading files: ${err.message || 'Unknown error'}`));
            }
        });
    }

    static _uploadFileWithRetry({ file, pathToDeploy, bucketName, retryCount, extractedStorageConfig, uploadHistory }) {
        return new Promise(async (resolve, reject) => {
            let isUploaded = false;
            let lastUploadErr;

            for (let i = 0; i < retryCount; i += 1) {
                try {
                    await this.runUploadFileHandler({ // eslint-disable-line
                        file,
                        bucketName,
                        pathToDeploy,
                        extractedStorageConfig
                    });

                    isUploaded = true;
                    break;
                } catch (e) {
                    if (i < retryCount) {
                        console.log(`Fail to upload file "${pathToDeploy}", retry to upload`);
                    }

                    lastUploadErr = e;
                }
            }

            if (isUploaded) {
                console.log(`File ${pathToDeploy} successful uploaded`);
                resolve(true);
            } else {
                logFailRetryUpload({ pathToDeploy, lastUploadErr, uploadHistory, bucketName });
                reject(new Error('Fail to upload file'));
            }
        });
    }

    static runUploadFileHandler(opts) {
        return StorageApi.getApi(opts).upload(opts);
    }

    static _getFilePathForDeployReport({ file, buildId, srcDir, isUploadFile, uploadFile, buildData }) {
        let resultPath;
        const subPath = config.env.bucketSubPath;
        let reportWrapDir = config.env.reportWrapDir;

        if (!isUploadFile) {
            const pathWithoutSrcDir = file.replace(srcDir, '');
            const pathToFile = pathWithoutSrcDir.startsWith('/') ? pathWithoutSrcDir : `/${pathWithoutSrcDir}`;
            reportWrapDir = reportWrapDir ? `/${reportWrapDir}` : '';
            resultPath = `${buildData.pipelineId}/${buildData.branch}/${subPath}${buildId}${reportWrapDir}${pathToFile}`;
        } else {
            reportWrapDir = reportWrapDir ? `${reportWrapDir}/` : '';
            resultPath = `${buildData.pipelineId}/${buildData.branch}/${subPath}${buildId}/${reportWrapDir}${path.parse(uploadFile).base}`;
        }

        return resultPath;
    }

    static _getFilePathForDeployHistory({ file, buildData }) {
        return `${buildData.pipelineId}/${buildData.branch}/${config.allureHistoryDir}/${path.parse(file).base}`;
    }

    static _getFilePathForDeploy(opts) {
        if (opts.uploadHistory) {
            return Uploader._getFilePathForDeployHistory(opts);
        }

        return Uploader._getFilePathForDeployReport(opts);
    }
}

function logStartUploadFiles({ uploadHistory }) {
    const msg = `Start upload ${uploadHistory ? 'allure history' : 'report'} files`;
    console.log('-'.repeat(msg.length + 1));
    Logger.log(msg);
    console.log('-'.repeat(msg.length + 1));
}

function logSuccessUploadFiles({ extractedStorageConfig, uploadHistory }) {
    if (uploadHistory) {
        Logger.log('Allure history was successfully uploaded');
    } else {
        Logger.log('All report files was successfully uploaded');
        console.log('You can access report on: ');
        Logger.log(extractedStorageConfig.linkOnReport);
    }
}

function logFailRetryUpload({ pathToDeploy, lastUploadErr, uploadHistory, bucketName }) {
    if (uploadHistory) {
        if (lastUploadErr.statusCode === FORBIDDEN_STATUS) {
            Logger.log(`Cant upload allure history, you must have delete permission to you bucket "${bucketName}"`);
        }
    }

    console.error(
        `Fail to upload file ${pathToDeploy}, error: `,
        lastUploadErr.message ? lastUploadErr.message : lastUploadErr
    );
}

module.exports = Uploader;
