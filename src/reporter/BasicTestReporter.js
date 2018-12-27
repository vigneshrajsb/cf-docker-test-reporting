'use strict';

const Exec = require('child_process').exec;
const _ = require('lodash');
const Workflow = require('../api/workflow');
const Logger = require('../logger');

class BasicTestReporter {
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

    async addBuildData(state) {
        const process = await Workflow.getProcessById({ id: state.config.env.buildId, config: state.config });
        state.buildData = { pipelineId: _.get(process, 'pipeline') };
    }

    async exportVariables({ extractedStorageConfig, config, buildData }) {
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
        await this.setExportVariable('TEST_REPORT_BRANCH', config.env.branchNormalized);

        await this.setExportVariable(
            'TEST_REPORT_INTEGRATION_TYPE',
            this._normalizeIntegrationName(extractedStorageConfig.integrationType)
        );

        if (extractedStorageConfig.name) {
            console.log(`Using storage integration, name: ${extractedStorageConfig.name}`);
            await this.setExportVariable('TEST_REPORT_CONTEXT', extractedStorageConfig.name);
        }

        if (config.env.reportIndexFile) {
            await this.setExportVariable('TEST_REPORT_UPLOAD_INDEX_FILE', config.env.reportIndexFile);
        }
    }

    showStartLogs({ config, isUpload }, fileReporter) {
        Logger.log('Start upload report');
        console.log(`Working directory: ${process.cwd()}`);

        if (fileReporter) {
            console.log('REPORT_DIR: ', config.env.reportDir);
            console.log('REPORT_INDEX_FILE: ', config.env.reportIndexFile);
        }

        if (isUpload) {
            console.log(`Start upload custom test report for build ${config.env.buildId}`);
            console.log('Using custom upload mode (only upload custom folder or file)');
        } else {
            console.log(`Start generating visualization of test report for build ${config.env.buildId}`);
            console.log('Using allure upload mode (generate allure visualization and upload it)');
        }

        console.log(`Max upload size for your account is ${config.uploadMaxSize} MB`);
    }

    _normalizeIntegrationName(name) {
        if (!_.isString(name)) {
            return name;
        }

        return name.split('.')[1];
    }

    _buildLinkOnReport({ extractedStorageConfig, buildData, config }) {
        const integType = this._normalizeIntegrationName(extractedStorageConfig.integrationType);
        const integName = extractedStorageConfig.name;
        const bucket = encodeURIComponent(config.env.originBucketName);
        const file = config.env.reportIndexFile || 'index.html';
        const pipeline = buildData.pipelineId;
        const branch = config.env.branchNormalized;
        const buildId = config.env.buildId;
        let reportWrap = config.env.reportWrapDir;
        reportWrap = reportWrap ? `${reportWrap}/` : '';

        return `${config.basicLinkOnReport}v2/${pipeline}/${branch}/${integType}/${integName}/${bucket}/${buildId}/${reportWrap}${file}`; // eslint-disable-line
    }
}

module.exports = BasicTestReporter;
