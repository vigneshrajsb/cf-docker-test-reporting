'use strict';

const rp = require('request-promise');
const fs = require('fs');
const config = require('../../config');
const gcs = require('@google-cloud/storage')(config.googleStorageConfig);

class GCSUploader {
    constructor({ extractedStorageConfig }) {
        const { storageConfig: { accessToken } = {} } = extractedStorageConfig;
        this.accessToken = accessToken;
        this.bucket = gcs.bucket(config.bucketName);
    }

    getUploader(storgeConfig) {
        if (storgeConfig.type !== 'auth') {
            return this._uploadFileUsingJson.bind(this);
        }

        return this._uploadFileUsingOauth.bind(this);
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
}

module.exports = GCSUploader;
