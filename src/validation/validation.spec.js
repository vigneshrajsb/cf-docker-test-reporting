/* eslint no-empty: 0 */

const expect = require('chai').expect;
const Validator = require('./index');
const Config = require('../../config');

const config = Config.getConfig();


describe('Validation', () => {
    describe('validateBuildData', () => {
        const validateBuildData = Validator.validateBuildData;

        function getBuildData(buildData = {}) {
            return Object.assign({
                pipelineId: 'fakePipelineId',
                branch: 'fakeBranch'
            }, buildData);
        }

        it('should throw err when build data not object', () => {
            const invalidVals = [0, null, '', undefined, [], true, () => false];

            invalidVals.forEach((val) => {
                try {
                    validateBuildData(val);
                    expect.fail(false, false, 'Should throw err on invalid value');
                } catch (e) {}
            });
        });

        it('should throw err when build data field have wrong type', () => {
            try {
                validateBuildData(getBuildData({ pipelineId: 1 }));
                expect.fail(false, false, 'Should throw err on invalid value');
            } catch (e) {}
        });

        it('should throw err when required build data field missing', () => {
            try {
                validateBuildData(getBuildData({ pipelineId: '' }));
                expect.fail(false, false, 'Should throw err on invalid value');
            } catch (e) {}
        });

        it('should pass when build data valid', () => {
            try {
                validateBuildData({ buildData: getBuildData(), config  });
            } catch (e) {
                expect.fail(false, false, 'Should pass on valid data');
            }
        });
    });

    describe('validateUploadDir', () => {
        const FileManager = require('../FileManager');
        const validateUploadDir = Validator.validateUploadDir;
        const fs = require('fs');

        it('should throw err when dir not exists', async () => {
            try {
                await validateUploadDir('./notExists.file');
                expect.fali(false, false, 'must throw err when dir not exists');
            } catch (e) {
                expect(e.message.includes('Directory for upload does not exist.')).to.equal(true);
            }
        });

        it('should throw err when dir is empty', async () => {
            const pathToDir = './testDir';
            await FileManager.createDir(pathToDir, { force: true });

            try {
                await validateUploadDir({ config }, pathToDir);
                expect.fali(false, false, 'must throw err when dir is empty');
            } catch (e) {
                expect(e.message.includes('Directory for upload is empty')).to.equal(true);
            }

            await FileManager.removeResource(pathToDir);
        });

        it('should throw err when dir is more than uploadMaxSize', async () => {
            const Vld = require('./index');
            const pathToDir = './testDir1';

            await FileManager.createDir(pathToDir, { force: true });
            fs.writeFileSync(`${pathToDir}/test.txt`, 'test'.repeat(100));

            try {
                await Vld.validateUploadDir({ config: { ...config, uploadMaxSize: 0.0001 } }, pathToDir);
                expect.fali(false, false, 'must throw err when dir more than uploadMaxSize');
            } catch (e) {
                expect(e.message.includes('Directory for upload is to large')).to.equal(true);
            }

            await FileManager.removeResource(pathToDir);
        });

        it('should pass when dir is valid', async () => {
            const Vld = require('./index');
            const pathToDir = './testDir2';

            await FileManager.createDir(pathToDir, { force: true });
            fs.writeFileSync(`${pathToDir}/test.txt`, 'test'.repeat(100));

            try {
                const result = await Vld.validateUploadDir({ config }, pathToDir);
                expect(result).to.equal(true);
            } catch (e) {
                expect.fali(false, false, 'must pass when dir valid');
            }

            await FileManager.removeResource(pathToDir);
        });
    });

    describe('validateUploadFile', () => {
        const validateUploadFile = Validator.validateUploadFile;
        const fs = require('fs');

        it('should throw err when file not exists', async () => {
            try {
                await validateUploadFile({ config });
                expect.fali(false, false, 'must throw err when file not exists');
            } catch (e) {
                expect(e.message.includes('File for upload does not exist')).to.equal(true);
            }
        });

        it('should throw err when file bigger then uploadMaxSize', async () => {
            const Vld = require('./index');
            const pathToFile = `${__dirname}/testFile.txt`;

            fs.writeFileSync(pathToFile, 'test'.repeat(100));

            try {
                await Vld.validateUploadFile({
                    config: { ...config, uploadMaxSize: 0.0003, env: { reportIndexFile: pathToFile } }
                });
                expect.fali(false, false, 'must throw err when file more than uploadMaxSize');
            } catch (e) {
                expect(e.message.includes('File for upload is to large')).to.equal(true);
            }

            fs.unlinkSync(pathToFile);
        });

        it('should pass when file is valid', async () => {
            const Vld = require('./index');
            const pathToFile = `${__dirname}/testFile1.txt`;

            fs.writeFileSync(pathToFile, 'test'.repeat(100));

            try {
                const result = await Vld.validateUploadFile({
                    config: { ...config, uploadMaxSize: 1, env: { reportIndexFile: pathToFile } }
                });
                expect(result).to.equal(true);
            } catch (e) {
                expect.fali(false, false, 'must pass without errors when file is valid');
            }

            fs.unlinkSync(pathToFile);
        });
    });
});
