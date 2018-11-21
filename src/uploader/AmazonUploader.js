'use strict';

const AWS = require('aws-sdk');
const config = require('../../config');
const fs = require('fs');

class GCSUploader {
    constructor() {
        AWS.config.loadFromPath(config.amazonKeyFileName);
        this.s3 = new AWS.S3({ signatureVersion: 'v4' });
    }

    getUploader() {
        return this._uploadFileToAmazon.bind(this);
    }

    _uploadFileToAmazon({ bucketName, file, pathToDeploy }) {
        const params = {
            Bucket: bucketName,
            Key: pathToDeploy,
            Body: fs.createReadStream(file)
        };

        return new Promise((res, rej) => {
            this.s3.upload(params, (err) => {
                if (err) {
                    rej(err);
                } else {
                    res();
                }
            });
        });
    }
}

module.exports = GCSUploader;
