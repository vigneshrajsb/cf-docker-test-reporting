const expect = require('chai').expect;
const UrlFactory = require('./index');

function _fomArrayToObj(arr) {
    return arr.reduce((memo, key) => Object.assign(memo, { [key]: key }), {});
}

describe('urlFactory', () => {


    describe('v2', () => {
        it('createFilePathForDeployHistory', () => {
            const url = new UrlFactory({ env: {} })
                .createFilePathForDeployHistory(_fomArrayToObj(['file', 'pipelineId', 'branchNormalized', 'allureHistoryDir']));
            expect(url).to.equal('pipelineId/branchNormalized/allureHistoryDir/file');
        });
        it('createLinkOnReport', () => {
            const url = new UrlFactory({ env: {} })
                .createLinkOnReport(_fomArrayToObj(['basicLinkOnReport', 'pipeline', 'branch', 'integType',
                    'integName', 'bucket', 'buildId', 'reportWrap', 'file']));
            expect(url).to.equal('basicLinkOnReportv2/pipeline/branch/integType/integName/bucket/buildId/reportWrapfile');
        });
    });

    describe('v2', () => {

        it('createFilePathForDeployHistory', () => {
            const url = new UrlFactory({ env: { reportPath: 'reportPath' } })
                .createFilePathForDeployHistory(
                    _fomArrayToObj(['file', 'pipelineId', 'branchNormalized', 'allureHistoryDir', 'reportPath'])
                );
            expect(url).to.equal('pipelineId/reportPath/branchNormalized/allureHistoryDir/file');
        });
        it('createLinkOnReport', () => {
            const url = new UrlFactory({ env: { reportPath: 'reportPath' } })
                .createLinkOnReport(_fomArrayToObj(['basicLinkOnReport', 'pipeline', 'branch', 'integType',
                    'integName', 'bucket', 'buildId', 'reportWrap', 'file', 'reportPath']));
            expect(url).to
                .equal('basicLinkOnReportv3/pipeline/branch/integType/integName/bucket/reportPath/buildId/reportWrapfile');
        });
    });

});
