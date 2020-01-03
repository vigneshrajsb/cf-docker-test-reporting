'use strict';

const FileManager = require('../FileManager');
const path = require('path');
const StorageApi = require('../storageApi');
const Logger = require('../logger');

const FORBIDDEN_STATUS = 403;
const MAX_FILES_FOR_LOGS = 1000;

class Uploader {
    static async uploadFiles(state, opts) {
        const { config, isUploadFile, extractedStorageConfig, buildData } = state;
        const { srcDir, uploadHistory } = opts;
        console.log(state);

        const {
            env: {
                bucketName,
                reportIndexFile: uploadFile
            }
        } = config;

        logStartUploadFiles({ uploadHistory });
        return new Promise(async (res, rej) => {
            try {
                const files = await FileManager._getFilesForUpload({ srcDir, uploadFile, isUploadFile });
                const logFileUpload = files.length < MAX_FILES_FOR_LOGS;
                let start = 0;
                let end = config.uploadParallelLimit;
                let filesChunk;

                if (!logFileUpload) {
                    console.log(`Skip log each file upload, total files to upload: "${files.length}"`);
                }

                while ((filesChunk = files.slice(start, end)).length) { // eslint-disable-line
                    const uploadPromises = filesChunk.map((file) => {
                        const pathToDeploy = this._getFilePathForDeploy({
                            file,
                            config,
                            srcDir,
                            isUploadFile,
                            uploadFile,
                            buildData,
                            uploadHistory
                        });

                        return this._uploadFileWithRetry({
                            file,
                            config,
                            pathToDeploy,
                            bucketName,
                            extractedStorageConfig,
                            uploadHistory,
                            logFileUpload
                        });
                    });
                    console.log('wait for files');
                    await Promise.all(uploadPromises); // eslint-disable-line
                    console.log('upload all files');
                    start += config.uploadParallelLimit;
                    end += config.uploadParallelLimit;
                }

                logSuccessUploadFiles(state, uploadHistory, files.length);
                res(true);
            } catch (err) {
                rej(new Error(`Error while uploading files: ${err.message || 'Unknown error'}`));
            }
        });
    }

    static _uploadFileWithRetry(opts) {
        const {
            file,
            pathToDeploy,
            config,
            bucketName,
            extractedStorageConfig,
            uploadHistory,
            logFileUpload
        } = opts;

        return new Promise(async (resolve, reject) => {
            let isUploaded = false;
            let lastUploadErr;

            for (let i = 0; i < config.uploadRetryCount; i += 1) {
                try {
                    await this.runUploadFileHandler({ // eslint-disable-line
                        file,
                        config,
                        bucketName,
                        pathToDeploy,
                        extractedStorageConfig
                    });

                    isUploaded = true;
                    break;
                } catch (e) {
                    if (i < config.uploadRetryCount) {
                        console.log(`Fail to upload file "${pathToDeploy}", retry to upload`);
                    }

                    lastUploadErr = e;
                }
            }

            if (isUploaded) {
                if (logFileUpload) {
                    const pathSplitted = pathToDeploy.split('/');
                    console.log(`${pathSplitted[pathSplitted.length - 1]} uploaded`);
                }
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

    static _getFilePathForDeployReport({ file, config, srcDir, isUploadFile, uploadFile, buildData }) {
        let resultPath;
        const branch = config.env.branchNormalized;
        const buildId = config.env.buildId;
        const subPath = config.env.bucketSubPath;
        let reportWrapDir = config.env.reportWrapDir;

        if (!isUploadFile) {
            const pathWithoutSrcDir = file.replace(srcDir, '');
            const pathToFile = pathWithoutSrcDir.startsWith('/') ? pathWithoutSrcDir : `/${pathWithoutSrcDir}`;
            reportWrapDir = reportWrapDir ? `/${reportWrapDir}` : '';
            resultPath = `${buildData.pipelineId}/${branch}/${subPath}${buildId}${reportWrapDir}${pathToFile}`;
        } else {
            reportWrapDir = reportWrapDir ? `${reportWrapDir}/` : '';
            resultPath = `${buildData.pipelineId}/${branch}/${subPath}${buildId}/${reportWrapDir}${path.parse(uploadFile).base}`;
        }

        return resultPath;
    }

    static _getFilePathForDeployHistory({ file, config, buildData }) {
        return `${buildData.pipelineId}/${config.env.branchNormalized}/${config.allureHistoryDir}/${path.parse(file).base}`;
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

function logSuccessUploadFiles({ linkOnReport }, uploadHistory, filesCnt) {
    if (uploadHistory) {
        Logger.log('Allure history was successfully uploaded');
    } else {
        Logger.log(`All ${filesCnt} report files was successfully uploaded`);
        console.log('You can access report on: ');
        Logger.log(linkOnReport);
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
