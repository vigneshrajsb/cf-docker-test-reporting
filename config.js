'use strict';

const path = require('path');
const _ = require('lodash');

const isProd = !_.get(process.env, 'CF_HOST_NAME', '').includes('local');
const apiHost = `${isProd ? 'https' : 'http'}://${isProd ? 'g.codefresh.io' : 'local.codefresh.io'}`;

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
    // uploadMaxSize in MB, this value set by Payments class on init
    uploadMaxSize: 0,
    uploadRetryCount: 3,
    basicLinkOnReport: `${apiHost}/api/testReporting/`,
    apiHost,
    apiKey: process.env.CF_API_KEY,
    storageIntegration: process.env.CF_STORAGE_INTEGRATION,
    paymentPlanMap: {
        FREE: 10,
        CUSTOM: 10,
        BASIC: 20,
        PRO: 30,
    }
};
