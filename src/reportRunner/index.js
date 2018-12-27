'use strict';

const Config = require('../../config');
const MultiReportRunner = require('./MultiReportRunner');
const SingleReportRunner = require('./SingleReportRunner');
const StorageConfigProvider = require('../storageConfig/StorageConfigProvider');
const Logger = require('../logger');
const PaymentsLogic = require('../paymentsLogic');

const config = Config.getConfig();
const storageConfigProvider = new StorageConfigProvider({ config });

class Runner {
    static async run() {
        try {
            const reporterData = await Runner.prepareForRun();
            let runner;

            if (config.env.multiReportUpload) {
                runner = MultiReportRunner;
            } else {
                runner = SingleReportRunner;
            }

            return await runner.run(reporterData);
        } catch (e) {
            console.error(e.message);
            process.exit(1);
        }
    }

    static async prepareForRun() {
        Logger.log('START REPORTER');

        Runner.validateRequiredVars();

        const uploadSize = await PaymentsLogic.getMaxUploadSizeDependingOnPlan({ config });
        const extractedStorageConfig = await storageConfigProvider.provide({ config });

        return { extractedStorageConfig, uploadSize };
    }

    static validateRequiredVars() {
        if (!config.env.originBucketName) {
            throw new Error('Test reporter requires BUCKET_NAME variable for upload files');
        }

        if (!config.env.branchNormalized) {
            throw new Error('Test reporter requires CF_BRANCH_TAG_NORMALIZED variable for upload files');
        }
    }
}

module.exports = Runner;
