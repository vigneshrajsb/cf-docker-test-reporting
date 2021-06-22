const path = require('path');

class V3 {

    createFilePathForDeployHistory({ file, reportPath, pipelineId, branchNormalized, allureHistoryDir }) {
        return `${pipelineId}/${reportPath}/${branchNormalized}/${allureHistoryDir}/${path.parse(file).base}`;
    }

    createLinkOnReport(
        {
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
        }
    ) {
        return [
            `${basicLinkOnReport}v3`, pipeline, branch, integType, integName, bucket,
            encodeURIComponent(reportPath), buildId, `${reportWrap}${file}`
        ].join('/');
    }
}

module.exports = new V3();
