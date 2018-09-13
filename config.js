'use strict';

const path = require('path');
const fs = require('fs');

const googleStorageCongigFile = 'google.storage.config.json';

// fs.writeFileSync(googleStorageCongigFile, process.env.STORAGE_CONFIG);

module.exports = {
    googleStorageConfig: {
        projectId: 'local-codefresh',
        keyFilename: path.resolve(__dirname, googleStorageCongigFile)
    },
    resultReportFolderName: 'allure-report',
    bucketName: 'pasha-codefresh'
};