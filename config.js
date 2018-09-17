'use strict';

const path = require('path');

module.exports = {
    googleStorageConfig: {
        projectId: 'local-codefresh',
        keyFilename: path.resolve(__dirname, 'google.storage.config.json')
    },
    resultReportFolderName: 'allure-report',
    bucketName: process.env.BUCKET_NAME
};