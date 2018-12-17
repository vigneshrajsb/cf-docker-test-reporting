'use strict';

const FileManager = require('../FileManager');
const path = require('path');
const config = require('../../config');
const StorageApi = require('../storageApi');

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
                                 isUploadHistory
    }) {
        Uploader._logStartUploadFiles({ isUploadHistory });
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
                        isUploadHistory
                    });

                    return this._uploadFileWithRetry({
                        file,
                        pathToDeploy,
                        bucketName,
                        retryCount: config.uploadRetryCount,
                        extractedStorageConfig,
                        isUploadHistory
                    });
                });

                Promise.all(uploadPromises).then(() => {
                    Uploader._logSuccessUploadFiles({ extractedStorageConfig, isUploadHistory });
                    res(true);
                }, (err) => { rej(err); });
            } catch (err) {
                rej(new Error(`Error while uploading files: ${err.message || 'Unknown error'}`));
            }
        });
    }

    static _uploadFileWithRetry({ file, pathToDeploy, bucketName, retryCount, extractedStorageConfig, isUploadHistory }) {
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
                Uploader._logFailRetryUpload({ pathToDeploy, lastUploadErr, isUploadHistory, bucketName });
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

        if (!isUploadFile) {
            const pathWithoutSrcDir = file.replace(srcDir, '');
            const pathToFile = pathWithoutSrcDir.startsWith('/') ? pathWithoutSrcDir : `/${pathWithoutSrcDir}`;
            resultPath = `${buildData.pipelineId}/${buildData.branch}/${subPath}${buildId}${pathToFile}`;
        } else {
            resultPath = `${buildData.pipelineId}/${buildData.branch}/${subPath}${buildId}/${path.parse(uploadFile).base}`;
        }

        return resultPath;
    }

    static _getFilePathForDeployHistory({ file, buildData }) {
        return `${buildData.pipelineId}/${buildData.branch}/${config.allureHistoryDir}/${path.parse(file).base}`;
    }

    static _getFilePathForDeploy(opts) {
        if (opts.isUploadHistory) {
            return Uploader._getFilePathForDeployHistory(opts);
        }

        return Uploader._getFilePathForDeployReport(opts);
    }

    static _logStartUploadFiles({ isUploadHistory }) {
        const msg = `Start upload ${isUploadHistory ? 'allure history' : 'report'} files`;
        console.log('-'.repeat(msg.length + 1));
        console.log(config.colors.aqua, msg, config.colors.none);
        console.log('-'.repeat(msg.length + 1));
    }

    static _logSuccessUploadFiles({ extractedStorageConfig, isUploadHistory }) {
        if (isUploadHistory) {
            console.log(config.colors.aqua, 'Allure history was successfully uploaded', config.colors.none);
        } else {
            console.log(config.colors.aqua, 'All report files was successfully uploaded', config.colors.none);
            console.log(`You can access report on ${extractedStorageConfig.linkOnReport}`);
        }
    }

    static _logFailRetryUpload({ pathToDeploy, lastUploadErr, isUploadHistory, bucketName }) {
        if (isUploadHistory) {
            if (lastUploadErr.statusCode === FORBIDDEN_STATUS) {
                console.log(
                    config.colors.aqua,
                    `Cant upload allure history, you must have delete permission to you bucket "${bucketName}"`,
                    config.colors.none
                );
            }
        }

        console.error(
            `Fail to upload file ${pathToDeploy}, error: `,
            lastUploadErr.message ? lastUploadErr.message : lastUploadErr
        );
    }
}

module.exports = Uploader;
