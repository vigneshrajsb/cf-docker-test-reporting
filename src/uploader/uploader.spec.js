'use strict';

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

function proxyquireUploader(opts) {
    const replaceObj = {};

    if (opts.config) {
        replaceObj['../../config'] = opts.config;
    }

    return proxyquire('./index.js', replaceObj);
}

describe('Uploader', function () {

    this.timeout(20000);

    it('_getFilePathForDeploy should build correct link with subdir path', async () => {
        const bucketSubPath = 'fakeSubPath';
        const file = 'fakeFile';
        const buildId = 'fakeBuildId';
        const srcDir = 'fakeSrcDir';
        const isUploadFile = false;
        const buildData = { pipelineId: 'fakePipeline', branch: 'fakeBranch' };
        const Uploader = await proxyquireUploader({ config: { bucketSubPath } });

        const deployPath = Uploader._getFilePathForDeploy({ file, buildId, srcDir, isUploadFile, buildData });
        console.log(deployPath);
        expect(deployPath).to.equal('fakePipeline/fakeBranch/fakeBuildId/fakeFile');
    });

    it('_getFilePathForDeploy should build correct link with out subdir path', async () => {
        const bucketSubPath = '';
        const file = 'fakeFile';
        const buildId = 'fakeBuildId';
        const srcDir = 'fakeSrcDir';
        const isUploadFile = false;
        const buildData = { pipelineId: 'fakePipeline', branch: 'fakeBranch' };
        const Uploader = await proxyquireUploader({ config: { bucketSubPath } });

        const deployPath = Uploader._getFilePathForDeploy({ file, buildId, srcDir, isUploadFile, buildData });
        expect(deployPath).to.equal('fakePipeline/fakeBranch/fakeBuildId/fakeFile');
    });
});
