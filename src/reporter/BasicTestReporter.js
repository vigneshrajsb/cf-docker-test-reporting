'use strict';

const config = require('../../config');
const Exec = require('child_process').exec;
const _ = require('lodash');
const Workflow = require('../api/workflow');

class BasicTestReporter {
    constructor() {
        this.buildId = config.env.buildId;
        this.volumePath = config.env.volumePath;
        this.branch = config.env.branchNormalized;
    }

    setExportVariable(varName, varValue) {
        return new Promise((res, rej) => {
            Exec(`echo ${varName}=${varValue} >> ${this.volumePath}/env_vars_to_export`, (err) => {
                if (err) {
                    rej(new Error(`Fail to set export variable, cause: ${err.message}`));
                }

                res();
            });
        });
    }

    findMissingVars(requiredVars) {
        const missingVars = [];

        requiredVars.forEach((varName) => {
            if (!process.env[varName]) {
                missingVars.push(varName);
            }
        });

        return missingVars;
    }

    async getBuildData() {
        const process = await Workflow.getProcessById(this.buildId);

        return {
            pipelineId: _.get(process, 'pipeline'),
            branch: this.branch
        };
    }

    async prepareForGenerateReport({ extractedStorageConfig, uploadIndexFile, isUpload, buildId, buildData }) {
        console.log(`Working directory: ${process.cwd()}`);

        if (isUpload) {
            console.log(`Start upload custom test report for build ${buildId}`);
            console.log('Using custom upload mode (only upload custom folder or file)');
        } else {
            console.log(`Start generating visualization of test report for build ${buildId}`);
            console.log('Using allure upload mode (generate allure visualization and upload it)');
        }

        console.log(`Max upload size for your account is ${config.uploadMaxSize} MB`);

        extractedStorageConfig.linkOnReport = this._buildLinkOnReport({ extractedStorageConfig, buildId, buildData });

        await this.setExportVariable('TEST_REPORT', true);
        await this.setExportVariable('TEST_REPORT_BUCKET_NAME', config.env.originBucketName);
        await this.setExportVariable('TEST_REPORT_PIPELINE_ID', buildData.pipelineId);
        await this.setExportVariable('TEST_REPORT_BRANCH', buildData.branch);

        await this.setExportVariable(
            'TEST_REPORT_INTEGRATION_TYPE',
            this._normalizeIntegrationName(extractedStorageConfig.integrationType)
        );

        if (extractedStorageConfig.name) {
            console.log(`Using storage integration, name: ${extractedStorageConfig.name}`);
            await this.setExportVariable('TEST_REPORT_CONTEXT', extractedStorageConfig.name);
        }

        if (uploadIndexFile) {
            await this.setExportVariable('TEST_REPORT_UPLOAD_INDEX_FILE', uploadIndexFile);
        }
    }

    isUploadMode(vars) {
        if (process.env.AllURE_DIR) {
            return false;
        }
        return vars.some(varName => !!process.env[varName]);
    }

    _normalizeIntegrationName(name) {
        if (!_.isString(name)) {
            return name;
        }

        return name.split('.')[1];
    }

    _buildLinkOnReport({ extractedStorageConfig, buildId, buildData }) {
        const integType = this._normalizeIntegrationName(extractedStorageConfig.integrationType);
        const integName = extractedStorageConfig.name;
        const bucket = encodeURIComponent(config.env.originBucketName);
        const file = process.env.REPORT_INDEX_FILE || 'index.html';
        const pipeline = buildData.pipelineId;
        const branch = buildData.branch;

        return `${config.basicLinkOnReport}${pipeline}/${branch}/${integType}/${integName}/${bucket}/${buildId}/${file}`;
    }
}

module.exports = BasicTestReporter;
