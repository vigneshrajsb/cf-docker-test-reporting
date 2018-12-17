'use strict';

const _ = require('lodash');
const rp = require('request-promise');
const storageTypesMap = require('./types');
const storageTypes = require('./storageTypes');
const fs = require('fs');
const config = require('../../config');

class StorageConfigProvider {
    constructor() {
        this.integrationName = config.env.storageIntegration;
    }

    async provide() {
        await this._getStorageConfig();
        await this._validateStorageConfig();
        await this._extractStorageConfig();
        await this._createStorageConfigFile();

        return this.extractedStorageConfig;
    }

    async _getStorageConfig() {
        const opts = {
            uri: `${config.apiHost}/api/contexts/${config.env.storageIntegration}/prepare`,
            headers: {
                'x-access-token': config.env.apiKey
            }
        };

        try {
            this.storageConfig = await rp(opts);
        } catch (e) {
            throw new Error(`Can't get storage integration: ${this.integrationName}`);
        }
    }

    _getStorageTypeHandler(storageConfig) {
        return storageTypesMap[_.get(storageConfig, 'spec.type')];
    }

    _parseStorageConfig() {
        let parsedConfig;

        try {
            parsedConfig = JSON.parse(this.storageConfig);

            if (!_.isObject(parsedConfig)) {
                throw new Error(`Config must be object, instead got ${typeof parsedConfig}`);
            }
        } catch (e) {
            throw new Error(`Error during parsing storage config, error: ${e.message ? e.message : 'Unknown error'}`);
        }

        return parsedConfig;
    }

    _extractStorageConfig() {
        this.storageHandler.extractStorageConfig();
        this.extractedStorageConfig = this.storageHandler.extractedConfig;
    }

    _validateStorageConfig() {
        console.log('Starting validate storage config');

        if (!this.integrationName) {
            throw new Error('This service requires integration with some storage, you can specify storage via CF_STORAGE_INTEGRATION'); // eslint-disable-line
        }

        const storageConfig = this._parseStorageConfig();

        const StorageHandler = this._getStorageTypeHandler(storageConfig);

        if (!StorageHandler) {
            throw new Error('Cant find handler for storage config \n' +
                `Check if storage integration name: "${this.integrationName}" is correct`);
        }

        const storageHandler = new StorageHandler({ storageConfig });
        this.storageHandler = storageHandler;

        storageHandler.validateConfig();

        console.log('Storage config valid!');
    }

    _createStorageConfigFile() {
        if (this.extractedStorageConfig.type === 'json') {
            let jsonConfigFileName;

            if (storageTypes.google === this.extractedStorageConfig.integrationType) {
                jsonConfigFileName = config.googleStorageConfig.keyFilename;
            } else if (storageTypes.amazon === this.extractedStorageConfig.integrationType) {
                jsonConfigFileName = config.amazonKeyFileName;
            } else {
                throw new Error(`Unsupported integration type "${this.extractedStorageConfig.integrationType}"`);
            }

            fs.writeFileSync(jsonConfigFileName, JSON.stringify(this.extractedStorageConfig.storageConfig));
        }
    }
}

module.exports = StorageConfigProvider;
