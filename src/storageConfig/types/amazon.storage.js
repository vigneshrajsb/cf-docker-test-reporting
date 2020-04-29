const BasicStorage = require('./basic.storage');
const _ = require('lodash');
const { amazon: amazonStorage } = require('../storageTypes');

class AmazonStorage extends BasicStorage {
    constructor({ storageConfig }) {
        super(storageConfig);
    }

    extractStorageConfig() {
        this.extractedConfig = {
            type: 'json',
            integrationType: amazonStorage,
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

module.exports = AmazonStorage;
