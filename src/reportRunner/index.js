'use strict';

const Config = require('../../config');
const MultiReportRunner = require('./MultiReportRunner');
const SingleReportRunner = require('./SingleReportRunner');
const StorageConfigProvider = require('../storageConfig/StorageConfigProvider');
const Logger = require('../logger');
const PaymentsLogic = require('../paymentsLogic');
const AnnotationLogic = require('../annotationLogic');
const _ = require('lodash');

class Runner {
    static async run() { // eslint-disable-line
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

            const report = await runner.run(reporterData);

            const singleConfig = _.isArray(config) ? config[0] : config;
            AnnotationLogic.createAnnotation({ config: singleConfig, value: report.reportLink })
                .then(() => Logger.log(`Annotation ${singleConfig.annotationName} was created.`))
                .catch(e => Logger.log('yellow', `Can't create annotation ${singleConfig.annotationName}.\n${e.message}`));

            return report;
        } catch (e) {
            console.error(e.message);
            process.exit(1);
        }
    }

    static async prepareForRun({ config, storageConfigProvider }) {
        Logger.log('START REPORTER');

        Runner.validateRequiredVars({ config });

        const uploadMaxSize = await PaymentsLogic.getMaxUploadSizeDependingOnPlan({ config });
        const extractedStorageConfig = await storageConfigProvider.provide({ config });

        return { extractedStorageConfig, uploadMaxSize };
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
