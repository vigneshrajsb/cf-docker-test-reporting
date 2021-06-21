const path = require('path');

class V2 {

    createFilePathForDeployHistory({ file, pipelineId, branchNormalized, allureHistoryDir }) {
        return `${pipelineId}/${branchNormalized}/${allureHistoryDir}/${path.parse(file).base}`;
    }

    createLinkOnReport(
        {
            basicLinkOnReport,
            pipeline,
            branch,
            integType,
            integName,
            bucket,
            buildId,
            reportWrap,
            file
        }
    ) {
        return [
            `${basicLinkOnReport}v2`, pipeline, branch, integType, integName, bucket,
            buildId, `${reportWrap}${file}`
        ].join('/');
    }
}

module.exports = new V2();
