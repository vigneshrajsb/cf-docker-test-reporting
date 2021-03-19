const rp = require('request-promise');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const FULL_USER_PERMISSION = '0744';

class GCSApi {
    constructor({ extractedStorageConfig, config }) {
        const gcs = new Storage(config.googleStorageConfig);
        const { storageConfig: { accessToken } = {} } = extractedStorageConfig;
        this.accessToken = accessToken;
        this.bucket = gcs.bucket(config.env.bucketName);
    }

    upload(opts) {
        if (opts.extractedStorageConfig.type !== 'auth') {
            return this._uploadFileUsingJson(opts);
        }
        return this._uploadFileUsingOauth(opts);
    }

    _uploadFileUsingOauth({ file, pathToDeploy, bucketName }) {
        const options = {
            uri: `https://www.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${pathToDeploy}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: fs.createReadStream(file)
        };

        return rp(options);
    }

    _uploadFileUsingJson({ file, pathToDeploy }) {
        return new Promise((resolve, reject) => {
            this.bucket.upload(file, { destination: pathToDeploy }, (err) => {
                if (err) {
                    reject(new Error(err.message || 'Unknown error during upload file'));
                } else {
                    resolve(true);
                }
            });
        });
    }

    downloadHistory(state) {
        if (state.extractedStorageConfig.type !== 'auth') {
            return this._downloadHistoryUsingJson(state);
        }
        return this._downloadHistoryUsingOauth(state);
    }

    async _downloadHistoryUsingOauth({ historyDir, config, buildData: { pipelineId } }) {
        const bucketName = config.env.bucketName;
        const branch = config.env.branchNormalized;

        const getFilesOpts = {
            uri: `https://www.googleapis.com/storage/v1/b/${bucketName}/o?prefix=${pipelineId}/${branch}/${config.allureHistoryDir}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        };

        const filesRes = await rp(getFilesOpts);
        const { items = [] } = JSON.parse(filesRes);

        const promises = items.map(({ mediaLink, name }) => {
            const baseName = path.basename(name);

            return new Promise((res, rej) => {
                const options = {
                    uri: mediaLink,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                };

                return rp(options)
                    .then((fileData) => {
                        fs.writeFile(`${historyDir}/${baseName}`, fileData, { mode: FULL_USER_PERMISSION }, (err) => {
                            if (err) {
                                rej(err);
                            }

                            res(true);
                        });
                    });
            });
        });

        return Promise.all(promises);
    }

    async _downloadHistoryUsingJson({ historyDir, config, buildData: { pipelineId } }) {
        const [files] = await this.bucket.getFiles({
            prefix: `${pipelineId}/${config.env.branchNormalized}/${config.allureHistoryDir}`
        });

        const promises = files.map(({ name }) => {
            const baseName = path.basename(name);

            const options = {
                /**
                 * The path to which the file should be downloaded
                 */
                destination: `${historyDir}/${baseName}`,
            };

            return this.bucket
                .file(name)
                .download(options);
        });

        return Promise.all(promises);
    }
}

module.exports = GCSApi;
