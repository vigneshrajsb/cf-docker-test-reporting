const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('Uploader', function () {

    this.timeout(20000);

    it('_getFilePathForDeploy should build correct link with subdir path', async () => {
        const bucketSubPath = 'fakeSubPath/';
        const file = 'fakeFile';
        const buildId = 'fakeBuildId';
        const srcDir = 'fakeSrcDir';
        const isUploadFile = false;
        const branchNormalized = 'fakeBranch';
        const buildData = { pipelineId: 'fakePipeline' };
        const Uploader = require('./index');

        const fakeConf = {
            env: {
                buildId,
                bucketSubPath,
                branchNormalized
            }
        };

        const deployPath = Uploader._getFilePathForDeploy({ file, buildId, srcDir, isUploadFile, buildData, config: fakeConf });
        console.log(deployPath);
        expect(deployPath).to.equal('fakePipeline/fakeBranch/fakeSubPath/fakeBuildId/fakeFile');
    });

    it('_getFilePathForDeploy should build correct link with out subdir path', async () => {
        const bucketSubPath = '';
        const file = 'fakeFile';
        const buildId = 'fakeBuildId';
        const srcDir = 'fakeSrcDir';
        const isUploadFile = false;
        const branchNormalized = 'fakeBranch';
        const buildData = { pipelineId: 'fakePipeline' };
        const Uploader = require('./index');

        const fakeConf = {
            env: {
                buildId,
                bucketSubPath,
                branchNormalized
            }
        };

        const deployPath = Uploader._getFilePathForDeploy({ file, buildId, srcDir, isUploadFile, buildData, config: fakeConf });
        expect(deployPath).to.equal('fakePipeline/fakeBranch/fakeBuildId/fakeFile');
    });

    it('uploadFiles must upload files by chunks', async () => {
        const Uploader = await proxyquire('./index.js', {
            '../FileManager': {
                _getFilesForUpload() {
                    return 'test,'.repeat(9).split(',');
                }
            }
        });

        const uploadFiles = Uploader.uploadFiles.bind({
            _getFilePathForDeploy() {},
            _uploadFileWithRetry() {}
        });

        const config = {
            env: {},
            uploadParallelLimit: 2
        };

        const PromiseAllSpy = sinon.spy(Promise, 'all');

        try {
            await uploadFiles({ config }, {});
            PromiseAllSpy.restore();
        } catch (e) {
            PromiseAllSpy.restore();
        }

        expect(PromiseAllSpy.callCount).to.equal(5);
    });
});
