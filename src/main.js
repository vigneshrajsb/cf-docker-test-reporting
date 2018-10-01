'use strict';

const allureCmd = require('../cf-allure-commandline');
const recursiveReadSync = require('recursive-readdir-sync');
const config = require('../config');
const fs = require('fs');
const Exec = require('child_process').exec;

/* json config wrapped in single quotes we need remove them before use config */
let content = fs.readFileSync(config.googleStorageConfig.keyFilename);
content = content.toString().replace(/'/gm, '');
fs.writeFileSync(config.googleStorageConfig.keyFilename, content);

const gcs = require('@google-cloud/storage')(config.googleStorageConfig);

function setExportVariable(varName, varValue) {
    try {
        Exec(`echo ${varName}=${varValue} >> ${process.env.VOLUME_PATH}/env_vars_to_export`, (err) => {
            if (err) {
                console.error(`Fail to set export variable, cause: ${err.message}`);
            } else {
                console.log(`Variable set success ${varName}`);
            }
        });
    } catch (e) {
        console.error(`Fail to set export variable, cause: ${e.message}`);
    }
}

class TestReporter {
    constructor({ buildId, dirForUpload, uploadIndexFile }) {
        this.buildId = buildId;
        this.dirForUpload = typeof dirForUpload === 'string' ? dirForUpload.trim() : dirForUpload;
        this.uploadIndexFile = typeof uploadIndexFile === 'string' ? uploadIndexFile.trim() : uploadIndexFile;
    }

    generateReport() {
        return allureCmd(['generate', config.sourceReportFolderName, '--clean']);
    }

    isUploadMode(vars) {
        return vars.some(varName => !!process.env[varName]);
    }

    findMissingVars(requiredVars) {
        const missingVars = [];

        requiredVars.forEach((varName) => {
            if (!process.env[varName]) {
                missingVars.push(varName);
            }
        });

        return missingVars;
    }

    async validateUploadDir(pathToDir) {
        if (!fs.existsSync(pathToDir)) {
            console.error(`Error: Directory for upload is not exists. 
Ensure that "working_directory" was specified for this step and he contains directory for upload`);
            return false;
        }

        if (!fs.readdirSync(pathToDir).length) {
            console.error('Error: Directory for upload is empty');
            return false;
        }

        if (config.directoryForUploadMaxSize < await this.getDirSize(pathToDir)) {
            console.error(`Error: Directory for upload is to large, max size is ${config.directoryForUploadMaxSize} MB`);
            return false;
        }

        return true;
    }

    async uploadFiles({ srcDir, bucket, buildId }) {
        try {
            const files = await recursiveReadSync(srcDir);

            console.log('Start upload report files');

            files.forEach((f) => {
                const pathToDeploy = buildId + f.replace(srcDir, '');
                bucket.upload(f, { destination: pathToDeploy }, (err) => {
                    if (!err) {
                        console.log(`File ${pathToDeploy} successful uploaded`);
                    } else {
                        console.error(`Fail to upload file ${pathToDeploy}, error: `, err.message ? err.message : err);
                    }
                });
            });
        } catch (err) {
            if (err.errno === 34) {
                console.error('Path does not exist');
            } else {
                console.error(err.message || 'Error while uploading files');
            }
        }
    }

    getDirSize(pathToDir) {
        return new Promise((res) => {
            Exec(`du -sk ${pathToDir}`, (err, response) => {
                const match = response.trim().match(/^[\d\.\,]+/);

                if (!match) {
                    res(null);
                }

                res(parseInt(match.toString().trim()) / 1024);
            });
        });
    }

    async start() { // eslint-disable-line
        console.log(`Working directory: ${process.cwd()}`);
        console.log('Volume path: ', process.env.VOLUME_PATH);

        setExportVariable('TEST_REPORT', true);

        const missedGeneralVars = this.findMissingVars(config.requiredGeneralVars);
        if (missedGeneralVars.length) {
            console.error(`Error: For this step you must specify ${missedGeneralVars.join(', ')} variable${missedGeneralVars.length > 1 ? 's' : ''}`);
            return null;
        }

        const bucket = gcs.bucket(config.bucketName);

        if (this.isUploadMode(config.requiredVarsForUploadMode)) {
            console.log('Start upload custom test report (without generating visualization of test report)');
            console.log('UPLOAD_DIR: ', this.dirForUpload);
            console.log('UPLOAD_DIR_INDEX_FILE: ', this.uploadIndexFile);

            setExportVariable('TEST_REPORT_UPLOAD_INDEX_FILE', this.uploadIndexFile);

            const missingVars = this.findMissingVars(config.requiredVarsForUploadMode);
            if (missingVars.length) {
                console.error(`For upload custom test report you must specify ${missingVars.join(', ')} variable${missingVars.length > 1 ? 's' : ''}`);
                return null;
            }

            if (!(await this.validateUploadDir(this.dirForUpload))) {
                return null;
            }

            await this.uploadFiles({ srcDir: this.dirForUpload, bucket, buildId: this.buildId });
        } else {
            if (!await this.validateUploadDir(config.sourceReportFolderName)) {
                return null;
            }

            console.log(`Start generating visualization of test report for build ${this.buildId}`);
            const generation = this.generateReport();
            generation.on('exit', async (exitCode) => {
                if (exitCode === 0) {
                    console.log('Report generation is finished successfully');
                } else {
                    console.error('Report generation is fail, exit with code:', exitCode);
                }

                await this.uploadFiles({ srcDir: config.resultReportFolderName, bucket, buildId: this.buildId });
            });
        }
    }
}

module.exports = TestReporter;
