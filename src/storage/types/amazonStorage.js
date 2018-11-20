'use strict';

const BasicStorage = require('./basicStorage');
const _ = require('lodash');
const { amazon } = require('../storageTypes');

class GoogleStorage extends BasicStorage {
    constructor({ storageConfig }) {
        super(storageConfig);
    }

    static getType() {
        return amazon;
    }

    extractStorageConfig() {
        this.extractedConfig = {
            type: 'json',
            integrationType: GoogleStorage.getType(),
            name: _.get(this.storageConfig, 'metadata.name'),
            storageConfig: _.get(this.storageConfig, 'spec.data.auth.jsonConfig')
        };
    }

    validateConfig() {
        this.extractStorageConfig();

        this.validateStorageConfFields();
    }

    validateStorageConfFields() {

        const { type, storageConfig } = this.extractedConfig;

        const requiredFields = ['accessKeyId', 'secretAccessKey'];
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
