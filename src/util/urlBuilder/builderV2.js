const path = require('path');

class BuilderV2 {

    constructor(options) {
        this.options = options;
    }

    buildFilePathForDeployHistory({ file, pipelineId, branchNormalized, allureHistoryDir }) {
        return `${pipelineId}/${branchNormalized}/${allureHistoryDir}/${path.parse(file).base}`;
    }

    buildLinkOnReport(
        basicLinkOnReport,
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
            `${basicLinkOnReport}v2`, pipeline, branch, integType, integName, bucket,
            buildId, `${reportWrap}${file}`
        ].join('/');
    }
}

module.exports = new BuilderV2();
