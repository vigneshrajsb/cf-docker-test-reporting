'use strict';

const BasicStorage = require('./basicStorage');
const _ = require('lodash');
const { google } = require('../storageTypes');

class GoogleStorage extends BasicStorage {
    constructor({ storageConfig }) {
        super(storageConfig);
    }

    static getType() {
        return google;
    }

    extractStorageConfig() {
        if (process.env.GCS_CONFIG) {
            this.extractedConfig = {
                type: 'json',
                integrationType: GoogleStorage.getType(),
                storageConfig: this.storageConfig
            };
        } else if (this.isStorageJsonConfigUsed(this.storageConfig)) {
            this.extractedConfig = {
                type: 'json',
                integrationType: GoogleStorage.getType(),
                name: _.get(this.storageConfig, 'metadata.name'),
                storageConfig: _.get(this.storageConfig, 'spec.data.auth.jsonConfig')
            };
        } else {
            this.extractedConfig = {
                type: 'auth',
                integrationType: GoogleStorage.getType(),
                name: _.get(this.storageConfig, 'metadata.name'),
                storageConfig: _.get(this.storageConfig, 'spec.data.auth')
            };
        }
    }

    validateConfig() {
        this.extractStorageConfig();

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
