'use strict';

const storageTypes = require('../storage/storageTypes');
const GCSUploader = require('./GSCUploader');
const AmazonUploader = require('./AmazonUploader');
const FileManager = require('../FileManager');
const path = require('path');
const config = require('../../config');

class Uploader {
    static async uploadFiles({ srcDir, buildId, bucketName, uploadFile, isUploadFile, extractedStorageConfig }) {
        return new Promise(async (res, rej) => {
            try {
                const files = await FileManager._getFilesForUpload({ srcDir, uploadFile, isUploadFile });

                console.log('Start upload report files');

                const uploadPromises = files.map((file) => {
                    const pathToDeploy = this._getFilePathForDeploy({ file, buildId, srcDir, isUploadFile, uploadFile });

                    return this._uploadFileWithRetry({
                        file,
                        pathToDeploy,
                        bucketName,
                        retryCount: config.uploadRetryCount,
                        extractedStorageConfig
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

    static _uploadFileWithRetry({ file, pathToDeploy, bucketName, retryCount, extractedStorageConfig }) {
        return new Promise(async (resolve, reject) => {
            let isUploaded = false;
            let lastUploadErr;

            for (let i = 0; i < retryCount; i += 1) {
                try {
                    const fileUploader = this.getUploadFileHandler(extractedStorageConfig);
                    await fileUploader({ // eslint-disable-line
                        file,
                        bucketName,
                        pathToDeploy,
                        retryCount,
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

    static getUploadFileHandler(extractedStorageConfig) {
        if (extractedStorageConfig.integrationType === storageTypes.amazon) {
            const amazonUploader = new AmazonUploader();
            return amazonUploader.getUploader(extractedStorageConfig);
        } else if (extractedStorageConfig.integrationType === storageTypes.google) {
            const gcsUploader = new GCSUploader({ extractedStorageConfig });
            return gcsUploader.getUploader(extractedStorageConfig);
        }

        throw new Error(`Cant find file uploader for storage config "${extractedStorageConfig.name}"`);
    }


    static _getFilePathForDeploy({ file, buildId, srcDir, isUploadFile, uploadFile }) {
        if (!isUploadFile) {
            const pathWithoutSrcDir = file.replace(srcDir, '');
            return buildId + (pathWithoutSrcDir.startsWith('/') ? pathWithoutSrcDir : `/${pathWithoutSrcDir}`);
        } else {
            return `${buildId}/${path.parse(uploadFile).base}`;
        }
    }
}

module.exports = Uploader;
