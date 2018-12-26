'use strict';

const path = require('path');
const _ = require('lodash');
const ConfigUtils = require('./ConfigUtils');

const apiHost = ConfigUtils.buildApiHost();
/**
 * arrayVars - customer can define array of this vars for upload multiple reports, for example REPORT_DIR.0
 */
const uploadArrayVars = ['REPORT_DIR', 'REPORT_INDEX_FILE', 'ALLURE_DIR', 'CLEAR_TEST_REPORT', 'REPORT_TYPE'];

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
    requiredVarsForUploadMode: ['REPORT_DIR', 'REPORT_INDEX_FILE'],
    uploadRetryCount: 3,
    basicLinkOnReport: `${apiHost}/api/testReporting/`,
    apiHost,
    allureHistoryDir: 'history',
    reportsIndexDir: '_reportsIndex_',
    uploadArrayVars,
    paymentPlanMap: {
        FREE: 30,
        CUSTOM: 30,
        BASIC: 30,
        PRO: 30,
    },
    env: {
        // bucketName - only bucket name, with out subdir path
        bucketName: ConfigUtils.getBucketName(),
        // bucketSubPath - parsed path to sub folder inside bucket
        bucketSubPath: ConfigUtils.getBucketSubPath(),
        // originBucketName - origin value that can contain subdir need to use it in some cases
        originBucketName: process.env.BUCKET_NAME,
        apiKey: process.env.CF_API_KEY,
        buildId: process.env.CF_BUILD_ID,
        volumePath: process.env.CF_VOLUME_PATH,
        branchNormalized: process.env.CF_BRANCH_TAG_NORMALIZED,
        storageIntegration: process.env.CF_STORAGE_INTEGRATION,
        sourceReportFolderName: _.get(process.env, 'ALLURE_DIR', 'allure-results').trim(),
        reportDir: _.get(process.env, 'REPORT_DIR', '').trim(),
        reportIndexFile: _.get(process.env, 'REPORT_INDEX_FILE', 'index.html').trim(),
        reportWrapDir: ConfigUtils.getReportWrapDir(),
        multiReportUpload: ConfigUtils.getMultiReportUpload(uploadArrayVars),
        reportType: process.env.REPORT_TYPE || 'default'
    },
    buildDataSignature: {
        pipelineId: { type: 'string', required: true },
        branch: { type: 'string', required: true },
    },
    colors: {
        aqua: '\x1b[36m',
        none: '\x1b[0m'
    }
};
