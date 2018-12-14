'use strict';

const path = require('path');
const _ = require('lodash');

const isProd = !_.get(process.env, 'CF_HOST_NAME', '').includes('local');
const apiHost = `${isProd ? 'https' : 'http'}://${isProd ? 'g.codefresh.io' : 'local.codefresh.io'}`;

const bucketNameSplitted = String(process.env.BUCKET_NAME).split('/');
const bucketName = bucketNameSplitted[0];
const bucketSubPath = bucketNameSplitted.slice(1).join('/');
/**
 * field uploadMaxSize set by PaymentsLogic on init, value in MB
 * @type {object}
 */
module.exports = {
    googleStorageConfig: {
        projectId: 'local-codefresh',
        keyFilename: path.resolve(__dirname, 'google.storage.config.json')
    },
    amazonKeyFileName: path.resolve(__dirname, 'amazon.storage.config.json'),
    resultReportFolderName: 'allure-report',
    sourceReportFolderName: process.env.ALLURE_DIR || 'allure-results',
    // bucketName - only bucket name, with out subdir path
    bucketName,
    // bucketSubPath - parsed path to sub folder inside bucket
    bucketSubPath,
    // originBucketName - origin value that can contain subdir need to use it in some cases
    originBucketName: process.env.BUCKET_NAME,
    requiredVarsForUploadMode: ['REPORT_DIR', 'REPORT_INDEX_FILE'],
    uploadRetryCount: 3,
    basicLinkOnReport: `${apiHost}/api/testReporting/`,
    apiHost,
    apiKey: process.env.CF_API_KEY,
    storageIntegration: process.env.CF_STORAGE_INTEGRATION,
    paymentPlanMap: {
        FREE: 30,
        CUSTOM: 30,
        BASIC: 30,
        PRO: 30,
    }
};
