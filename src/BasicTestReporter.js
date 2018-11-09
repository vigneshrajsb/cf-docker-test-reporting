'use strict';

const config = require('../config');
const gcs = require('@google-cloud/storage')(config.googleStorageConfig);
const Exec = require('child_process').exec;
const _ = require('lodash');

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

    extractStorageConfigFromVar() {
        const usedConf = process.env.GCS_CONFIG || process.env.STORAGE_INTEGRATION;
        let parsedConf;

        try {
            parsedConf = JSON.parse(usedConf);

            if (!_.isObject(parsedConf)) {
                throw new Error(`Config must be object, instead got ${typeof parsedConf}`);
            }
        } catch (e) {
            throw new Error(`Error during parsing storage config, error: ${e.message ? e.message : 'Unknown error'}`);
        }

        if (process.env.GCS_CONFIG) {
            return { type: 'json', storageConfig: parsedConf };
        }

        if (this.isStorageJsonConfigUsed(parsedConf)) {
            return {
                type: 'json',
                name: _.get(parsedConf, 'metadata.name'),
                storageConfig: _.get(parsedConf, 'spec.data.auth.jsonConfig')
            };
        } else {
            return {
                type: 'auth',
                name: _.get(parsedConf, 'metadata.name'),
                storageConfig: _.get(parsedConf, 'spec.data.auth')
            };
        }
    }

    validateStorageConfig() {
        console.log('Starting validate storage config');

        if (!process.env.GCS_CONFIG && !process.env.STORAGE_INTEGRATION) {
            throw new Error('This service require storage config, you can specify them using GCS_CONFIG variable or specify integration via CF_STORAGE_INTEGRATION');
        }

        const { type, storageConfig } = this.extractStorageConfigFromVar();

        this.validateStorageConfFields(storageConfig, type);

        console.log('Storage config valid!');
    }

    isStorageJsonConfigUsed(conf) {
        return _.get(conf, 'spec.data.auth.type') !== 'oauth2';
    }

    validateStorageConfFields(conf, type) {
        if (!_.isObject(conf)) {
           throw new Error(`Storage ${type} config must be an object, instead got ${typeof conf}`);
        }

        const requiredFields = type === 'json' ? ['client_email', 'private_key'] : ['accessToken', 'refreshToken'];
        const missingVars = [];

        requiredFields.forEach((reqVar) => {
            if (!conf[reqVar]) {
                missingVars.push(reqVar);
            }
        });

        if (missingVars.length) {
            throw new Error(`Missing fields in ${type} config: ${missingVars.join(', ')} is required`);
        }
    }
}

module.exports = BasicTestReporter;
