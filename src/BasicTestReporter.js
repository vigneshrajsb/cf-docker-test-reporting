'use strict';

const config = require('../config');
const gcs = require('@google-cloud/storage')(config.googleStorageConfig);
const Exec = require('child_process').exec;

class BasicTestReporter {
    constructor({
                    buildId = process.env.CF_BUILD_ID,
                    volumePath = process.env.CF_VOLUME_PATH
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
                }

                res();
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

    async prepareForGenerateReport() {
        console.log(`Working directory: ${process.cwd()}`);

        await this.setExportVariable('TEST_REPORT', true);
    }

    isUploadMode(vars) {
        if (process.env.AllURE_DIR) {
            return false;
        }
        return vars.some(varName => !!process.env[varName]);
    }
}

module.exports = BasicTestReporter;
