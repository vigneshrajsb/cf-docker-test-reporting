'use strict';

const BasicStorage = require('./basicStorage');
const _ = require('lodash');
const { azure } = require('../storageTypes');

class AzureStorage extends BasicStorage {
    constructor({ storageConfig }) {
        super(storageConfig);
    }

    static getType() {
        return azure;
    }

    extractStorageConfig() {
        this.extractedConfig = {
            type: 'json',
            integrationType: AzureStorage.getType(),
            name: _.get(this.storageConfig, 'metadata.name'),
            storageConfig: _.get(this.storageConfig, 'spec.data.auth')
        };
    }

    validateConfig() {
        this.extractStorageConfig();

        this.validateStorageConfFields();
    }

    validateStorageConfFields() {

        const { type, storageConfig } = this.extractedConfig;

        const requiredFields = ['accountName', 'accountKey'];
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

module.exports = AzureStorage;
