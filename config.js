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
    requiredGeneralVars: ['BUILD_ID', 'VOLUME_PATH'],
    requiredVarsForUploadMode: ['UPLOAD_DIR', 'UPLOAD_DIR_INDEX_FILE'],
    // directoryForUploadMaxSize in MB
    directoryForUploadMaxSize: 10,
};