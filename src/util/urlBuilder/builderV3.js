const path = require('path');

class BuilderV3 {

    constructor(options) {
        this.options = options;
    }

    buildFilePathForDeployHistory({ file, reportPath, pipelineId, branchNormalized, allureHistoryDir }) {
        return `${pipelineId}/${reportPath}/${branchNormalized}/${allureHistoryDir}/${path.parse(file).base}`;
    }

    buildLinkOnReport(
        basicLinkOnReport,
        reportPath,
        pipeline,
        branch,
        integType,
        integName,
        bucket,
        buildId,
        reportWrap,
        file
    ) {
        return [
            `${basicLinkOnReport}v3`, pipeline, branch, integType, integName, bucket,
            Buffer.from(reportPath).toString('base64'), buildId, `${reportWrap}${file}`
        ].join('/');
    }
}

module.exports = new BuilderV3();
