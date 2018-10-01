'use strict';

const Exec = require('child_process').exec;
const config = require('../config');
const fs = require('fs');
const recursiveReadSync = require('recursive-readdir-sync');
const gcs = require('@google-cloud/storage')(config.googleStorageConfig);

class BasicTestReporter {
    constructor({
                    buildId = process.env.BUILD_ID,
                    volumePath = process.env.VOLUME_PATH
                } = {}
    ) {
        this.buildId = buildId;
        this.volumePath = volumePath;
        this.bucket = gcs.bucket(config.bucketName);
    }

    setExportVariable(varName, varValue) {
        return new Promise((res, rej) => {
            Exec(`echo ${varName}=${varValue} >> ${this.volumePath}/env_vars_to_export`, (err) => {
                if (err) {
                    rej(new Error(`Fail to set export variable, cause: ${err.message}`));
                } else {
                    console.log(`Variable set success ${varName}`);
                    res();
                }
            });
        });
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
            throw new Error(`Error: Directory for upload is not exists. 
Ensure that "working_directory" was specified for this step and he contains directory for upload`);
        }

        if (!fs.readdirSync(pathToDir).length) {
            throw new Error('Error: Directory for upload is empty');
        }

        if (config.directoryForUploadMaxSize < await this.getDirSize(pathToDir)) {
            throw new Error(`Error: Directory for upload is to large, max size is ${config.directoryForUploadMaxSize} MB`)
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
                throw new Error('Error while uploading files: Path does not exist');
            } else {
                throw new Error(`Error while uploading files: ${err.message || 'Error while uploading files'}`);
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

    async prepareForGenerateReport() {
        console.log(`Working directory: ${process.cwd()}`);
        console.log('Volume path: ', this.volumePath);

        await this.setExportVariable('TEST_REPORT', true);

        const missedGeneralVars = this.findMissingVars(config.requiredGeneralVars);
        if (missedGeneralVars.length) {
            throw new Error(`Error: For this step you must specify ${missedGeneralVars.join(', ')} variable${missedGeneralVars.length > 1 ? 's' : ''}`);
        }
    }
}

module.exports = BasicTestReporter;
