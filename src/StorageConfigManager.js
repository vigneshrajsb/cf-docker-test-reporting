'use strict';

const _ = require('lodash');

class StorageConfigManager {
    static extractStorageConfigFromVar() {
        const usedConfig = process.env.GCS_CONFIG || process.env.STORAGE_INTEGRATION;
        let parsedConfig;

        try {
            parsedConfig = JSON.parse(usedConfig);

            if (!_.isObject(parsedConfig)) {
                throw new Error(`Config must be object, instead got ${typeof parsedConfig}`);
            }
        } catch (e) {
            throw new Error(`Error during parsing storage config, error: ${e.message ? e.message : 'Unknown error'}`);
        }

        if (process.env.GCS_CONFIG) {
            return { type: 'json', storageConfig: parsedConfig };
        }

        if (this.isStorageJsonConfigUsed(parsedConfig)) {
            return {
                type: 'json',
                name: _.get(parsedConfig, 'metadata.name'),
                storageConfig: _.get(parsedConfig, 'spec.data.auth.jsonConfig')
            };
        } else {
            return {
                type: 'auth',
                name: _.get(parsedConfig, 'metadata.name'),
                storageConfig: _.get(parsedConfig, 'spec.data.auth')
            };
        }
    }

    static validateStorageConfig() {
        console.log('Starting validate storage config');

        if (!process.env.GCS_CONFIG && !process.env.STORAGE_INTEGRATION) {
            throw new Error('This service require storage config, you can specify them using GCS_CONFIG variable or specify integration via CF_STORAGE_INTEGRATION'); // eslint-disable-line
        }

        const { type, storageConfig } = this.extractStorageConfigFromVar();

        this.validateStorageConfFields(storageConfig, type);

        console.log('Storage config valid!');
    }

    static isStorageJsonConfigUsed(config) {
        return _.get(config, 'spec.data.auth.type') !== 'oauth2';
    }

    static validateStorageConfFields(config, type) {
        if (!_.isObject(config)) {
            throw new Error(`Storage ${type} config must be an object, instead got ${typeof config}`);
        }

        const requiredFields = type === 'json' ? ['client_email', 'private_key'] : ['accessToken', 'refreshToken'];
        const missingVars = [];

        requiredFields.forEach((reqVar) => {
            if (!config[reqVar]) {
                missingVars.push(reqVar);
            }
        });

        if (missingVars.length) {
            throw new Error(`Missing fields in ${type} config: ${missingVars.join(', ')} is required`);
        }
    }
}

module.exports = StorageConfigManager;
