const _ = require('lodash');
const CodefreshAPI = require('../api');
const Logger = require('../logger');
const exporter = require('../util/envExporter');
const UrlBuilder = require('../util/urlBuilder/index');


class BasicTestReporter {
    setExportVariable(varName, varValue, config) {
        return exporter.export({ key: varName, value: varValue, config });
    }

    async addBuildData(state) {
        const process = await CodefreshAPI.getProcessById({ id: state.config.env.buildId, config: state.config });
        state.buildData = { pipelineId: _.get(process, 'pipeline') };
    }

    async exportVariables({ extractedStorageConfig, config, buildData, linkOnReport }) {
        /**
         * reportWrapDir - exists only when multiple reports uploads
         * not need export variables on upload each of multiple reports,
         * because this vars will be exported when reportsIndexDir will be uploads
         */
        if (config.env.reportWrapDir) {
            return;
        }

        if (linkOnReport) {
            await this.setExportVariable('TEST_REPORT_LINK', linkOnReport, config);
        }

        await this.setExportVariable('TEST_REPORT', true, config);
        await this.setExportVariable('TEST_REPORT_BUCKET_NAME', config.env.originBucketName, config);
        await this.setExportVariable('TEST_REPORT_PIPELINE_ID', buildData.pipelineId, config);
        await this.setExportVariable('TEST_REPORT_BRANCH', config.env.branchNormalized, config);

        await this.setExportVariable(
            'TEST_REPORT_INTEGRATION_TYPE',
            this._normalizeIntegrationName(extractedStorageConfig.integrationType),
            config
        );

        if (extractedStorageConfig.name) {
            console.log(`Using storage integration, name: ${extractedStorageConfig.name}`);
            await this.setExportVariable('TEST_REPORT_CONTEXT', extractedStorageConfig.name, config);
        }

        if (config.env.reportIndexFile) {
            await this.setExportVariable('TEST_REPORT_UPLOAD_INDEX_FILE', config.env.reportIndexFile, config);
        }

        // we pass it only in case with plugin
        if (config.stepName) {
            await this.setExportVariable(`${config.stepName}_CF_OUTPUT_URL`, linkOnReport, config);
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

        return new UrlBuilder(config).buildLinkOnReport({
            basicLinkOnReport: config.basicLinkOnReport,
            reportPath: config.env.reportPath,
            pipeline,
            branch,
            integType,
            integName,
            bucket,
            buildId,
            reportWrap,
            file
        });
    }
}

module.exports = BasicTestReporter;
