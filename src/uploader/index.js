'use strict';

const storageTypes = require('../storage/storageTypes');
const GCSUploader = require('./GSCUploader');
const AmazonUploader = require('./AmazonUploader');
const FileManager = require('../FileManager');
const path = require('path');
const config = require('../../config');

class Uploader {
    static async uploadFiles({
                                 srcDir,
                                 buildId,
                                 bucketName,
                                 uploadFile,
                                 isUploadFile,
                                 extractedStorageConfig,
                                 extraData
    }) {
        return new Promise(async (res, rej) => {
            try {
                const files = await FileManager._getFilesForUpload({ srcDir, uploadFile, isUploadFile });

                console.log('Start upload report files');

                const uploadPromises = files.map((file) => {
                    const pathToDeploy = this._getFilePathForDeploy({
                        file,
                        buildId,
                        srcDir,
                        isUploadFile,
                        uploadFile,
                        extraData
                    });

                    return this._uploadFileWithRetry({
                        file,
                        pathToDeploy,
                        bucketName,
                        retryCount: config.uploadRetryCount,
                        extractedStorageConfig
                    });
                });

                Promise.all(uploadPromises).then(() => {
                    console.log('All report files was successfully uploaded \n' +
                    `You can access it on ${extractedStorageConfig.linkOnReport}`);
                    res(true);
                }, (err) => { rej(err); });
            } catch (err) {
                rej(new Error(`Error while uploading files: ${err.message || 'Unknown error'}`));
            }
        });
    }

    static _uploadFileWithRetry({ file, pathToDeploy, bucketName, retryCount, extractedStorageConfig }) {
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
                console.error(`Fail to upload file ${pathToDeploy}, error: `, lastUploadErr.message ? lastUploadErr.message : lastUploadErr); // eslint-disable-line
                reject(new Error('Fail to upload file'));
            }
        });
    }

    static runUploadFileHandler(opts) {
        if (opts.extractedStorageConfig.integrationType === storageTypes.amazon) {
            const amazonUploader = new AmazonUploader();
            return amazonUploader.upload(opts);
        } else if (opts.extractedStorageConfig.integrationType === storageTypes.google) {
            const gcsUploader = new GCSUploader(opts);
            return gcsUploader.upload(opts);
        }

        throw new Error(`Cant find file uploader for storage config "${opts.extractedStorageConfig.name}"`);
    }


    static _getFilePathForDeploy({ file, buildId, srcDir, isUploadFile, uploadFile, extraData }) {
        if (!isUploadFile) {
            const pathWithoutSrcDir = file.replace(srcDir, '');
            return `${extraData.pipelineId}/${extraData.branch}/${buildId}` + (pathWithoutSrcDir.startsWith('/') ? pathWithoutSrcDir : `/${pathWithoutSrcDir}`);
        } else {
            return `${extraData.pipelineId}/${extraData.branch}/${buildId}/${path.parse(uploadFile).base}`;
        }
    }
}

module.exports = Uploader;
