'use strict';

const config = require('../config');
const fs = require('fs');
const gcs = require('@google-cloud/storage')(config.googleStorageConfig);
const { getDirSize } = require('./FileManager');
const Exec = require('child_process').exec;

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

        if (config.directoryForUploadMaxSize < await getDirSize(pathToDir)) {
            throw new Error(`Error: Directory for upload is to large, max size is ${config.directoryForUploadMaxSize} MB`)
        }

        return true;
    }

    async prepareForGenerateReport() {
        console.log(`Working directory: ${process.cwd()}`);
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
