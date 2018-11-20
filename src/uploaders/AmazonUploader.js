'use strict';

const fileManager = require('../FileManager');
const AWS = require('aws-sdk');
const config = require('../../config');

class GCSUploader {
    static upload(opts) {
        AWS.config.loadFromPath(config.amazonKeyFileName);
        const s3 = new AWS.S3({ signatureVersion: 'v4' });

        opts.s3 = s3;

        return fileManager.uploadFiles(opts);
    }
}

module.exports = GCSUploader;
