const BasicStorage = require('./basic.storage');
const _ = require('lodash');
const { google } = require('../storageTypes');

class GoogleStorage extends BasicStorage {
    constructor({ storageConfig }) {
        super(storageConfig);
    }

    extractStorageConfig() {
        const config = {
            integrationType: google,
            name: _.get(this.storageConfig, 'metadata.name'),
        };
        if (this.isStorageJsonConfigUsed(this.storageConfig)) {
            config.type = 'json';
            config.storageConfig = _.get(this.storageConfig, 'spec.data.auth.jsonConfig');
        } else {
            config.type = 'auth';
            config.storageConfig = _.get(this.storageConfig, 'spec.data.auth');
        }
        return config;
    }

    validateConfig() {
        this.extractedConfig = this.extractStorageConfig();

        this.validateStorageConfFields();
    }

    validateStorageConfFields() {

        const { type, storageConfig } = this.extractedConfig;

        const requiredFields = type === 'json' ? ['client_email', 'private_key'] : ['accessToken', 'refreshToken'];
        const missingVars = [];

        requiredFields.forEach((reqVar) => {
            if (!storageConfig[reqVar]) {
                missingVars.push(reqVar);
            }
        });

        if (missingVars.length) {
            throw new Error(`Missing fields in ${type} config: ${missingVars.join(', ')} is required`);
        }
    }
}

module.exports = GoogleStorage;
