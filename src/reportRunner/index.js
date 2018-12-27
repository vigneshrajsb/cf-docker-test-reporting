'use strict';

const Config = require('../../config');
const MultiReportRunner = require('./MultiReportRunner');
const SingleReportRunner = require('./SingleReportRunner');
const StorageConfigProvider = require('../storageConfig/StorageConfigProvider');
const Logger = require('../logger');
const PaymentsLogic = require('../paymentsLogic');
const _ = require('lodash');

class Runner {
    static async run() {
        try {
            let runner;
            let config;

            if (Config.isMultiUpload()) {
                config = Config.getMultipleConfig();
                runner = MultiReportRunner;
            } else {
                config = Config.getSingleConfig();
                runner = SingleReportRunner;
            }

            const storageConfigProvider = new StorageConfigProvider({ config: _.isArray(config) ? config[0] : config });
            const reporterData = await Runner.prepareForRun({
                config: _.isArray(config) ? config[0] : config,
                storageConfigProvider
            });

            reporterData.config = config;

            return await runner.run(reporterData);
        } catch (e) {
            console.error(e.message);
            process.exit(1);
        }
    }

    static async prepareForRun({ config, storageConfigProvider }) {
        Logger.log('START REPORTER');

        Runner.validateRequiredVars({ config });

        const uploadSize = await PaymentsLogic.getMaxUploadSizeDependingOnPlan({ config });
        const extractedStorageConfig = await storageConfigProvider.provide({ config });

        return { extractedStorageConfig, uploadSize };
    }

    static validateRequiredVars({ config }) {
        if (!config.env.originBucketName) {
            throw new Error('Test reporter requires BUCKET_NAME variable for upload files');
        }

        if (!config.env.branchNormalized) {
            throw new Error('Test reporter requires CF_BRANCH_TAG_NORMALIZED variable for upload files');
        }
    }
}

module.exports = Runner;
