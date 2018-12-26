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

    async getBuildData() {
        const process = await Workflow.getProcessById(this.buildId);

        return {
            pipelineId: _.get(process, 'pipeline'),
            branch: this.branch
        };
    }

    async exportVariables({ extractedStorageConfig, uploadIndexFile, buildId, buildData }) {
        /**
         * reportWrapDir - exists only when multiple reports uploads
         * not need export variables on upload each of multiple reports,
         * because this vars will be exported when reportsIndexDir will be uploads
         */
        if (config.env.reportWrapDir) {
            return;
        }

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

    showStartLogs({ buildId, isUpload, fileReporter }){
        console.log(`Working directory: ${process.cwd()}`);

        if (fileReporter) {
            console.log('REPORT_DIR: ', config.env.reportDir);
            console.log('REPORT_INDEX_FILE: ', config.env.reportIndexFile);
        }

        if (isUpload) {
            console.log(`Start upload custom test report for build ${buildId}`);
            console.log('Using custom upload mode (only upload custom folder or file)');
        } else {
            console.log(`Start generating visualization of test report for build ${buildId}`);
            console.log('Using allure upload mode (generate allure visualization and upload it)');
        }

        console.log(`Max upload size for your account is ${config.uploadMaxSize} MB`);
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
        const file = config.env.reportIndexFile;
        const pipeline = buildData.pipelineId;
        const branch = buildData.branch;
        let reportWrap = config.env.reportWrapDir;
        reportWrap = reportWrap ? `${reportWrap}/` : '';

        return `${config.basicLinkOnReport}v2/${pipeline}/${branch}/${integType}/${integName}/${bucket}/${buildId}/${reportWrap}${file}`; // eslint-disable-line
    }
}

module.exports = BasicTestReporter;
