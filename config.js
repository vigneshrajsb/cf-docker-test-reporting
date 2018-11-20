'use strict';

const path = require('path');

module.exports = {
    googleStorageConfig: {
        projectId: 'local-codefresh',
        keyFilename: path.resolve(__dirname, 'google.storage.config.json')
    },
    amazonKeyFileName: path.resolve(__dirname, 'amazon.storage.config.json'),
    resultReportFolderName: 'allure-report',
    sourceReportFolderName: process.env.ALLURE_DIR || 'allure-results',
    bucketName: process.env.BUCKET_NAME,
    requiredVarsForUploadMode: ['REPORT_DIR', 'REPORT_INDEX_FILE'],
    // uploadMaxSize in MB
    uploadMaxSize: 30,
    uploadRetryCount: 3,
    productionHost: 'g.codefresh.io'
};
