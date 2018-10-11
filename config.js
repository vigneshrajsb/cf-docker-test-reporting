'use strict';

const path = require('path');

module.exports = {
    googleStorageConfig: {
        projectId: 'local-codefresh',
        keyFilename: path.resolve(__dirname, 'google.storage.config.json')
    },
    resultReportFolderName: 'allure-report',
    sourceReportFolderName: 'allure-results',
    bucketName: process.env.BUCKET_NAME,
    requiredVarsForUploadMode: ['REPORT_DIR', 'REPORT_INDEX_FILE'],
    // directoryForUploadMaxSize in MB
    directoryForUploadMaxSize: 30,
};
