'use strict';

const _ = require('lodash');
const rp = require('request-promise');
const { productionHost } = require('../../config');
const storageTypesMap = require('./types');
const storageTypes = require('./storageTypes');
const GoogleStorage = require('./types/googleStorage');
const fs = require('fs');
const config = require('../../config');

class StorageConfigManager {
    static async getStorageConfig() {
        if (this.isUsedIntegrationStorage()) {
            const isProd = !_.get(process.env, 'CF_HOST_NAME', '').includes('local');

            const opts = {
                uri: `${isProd ? 'https' : 'http'}://${isProd ? productionHost : process.env.CF_HOST_NAME}/api/contexts/${process.env.CF_STORAGE_INTEGRATION}/prepare`,
                headers: {
                    'x-access-token': process.env.CF_API_KEY
                }
            };

            try {
                this.storageConfig = await rp(opts);
            } catch (e) {
                throw new Error(`Can't get storage integration: ${process.env.CF_STORAGE_INTEGRATION}`);
            }
        } else {
            this.storageConfig = process.env.GCS_CONFIG;
        }
    }

    static getStorageTypeHandler(storageConfig) {
        if (process.env.GCS_CONFIG) {
            return storageTypesMap[GoogleStorage.getType()];
        } else {
            return storageTypesMap[_.get(storageConfig, 'spec.type')];
        }
    }

    static isUsedIntegrationStorage() {
        return process.env.CF_STORAGE_INTEGRATION && !process.env.GCS_CONFIG;
    }

    static parseStorageConfig() {
        const usedConfig = process.env.GCS_CONFIG || this.storageConfig;
        let parsedConfig;

        try {
            parsedConfig = JSON.parse(usedConfig);

            if (!_.isObject(parsedConfig)) {
                throw new Error(`Config must be object, instead got ${typeof parsedConfig}`);
            }
        } catch (e) {
            throw new Error(`Error during parsing storage config, error: ${e.message ? e.message : 'Unknown error'}`);
        }

        return parsedConfig;
    }

    static getExtractedStorageConfig() {
        this.storageHandler.extractStorageConfig();
        return this.storageHandler.extractedConfig;
    }

    static validateStorageConfig() {
        console.log('Starting validate storage config');

        if (!process.env.GCS_CONFIG && !process.env.CF_STORAGE_INTEGRATION) {
            throw new Error('This service require storage config, you can specify them using GCS_CONFIG variable or specify integration via CF_STORAGE_INTEGRATION'); // eslint-disable-line
        }

        const storageConfig = this.parseStorageConfig();

        const StorageHandler = this.getStorageTypeHandler(storageConfig);

        if (!StorageHandler) {
            const integMsg = this.isUsedIntegrationStorage() ?
                `Check if storage integration name: "${process.env.CF_STORAGE_INTEGRATION}" is correct` : '';
            throw new Error(`Cant find handler for storage config ${integMsg}`);
        }

        const storageHandler = new StorageHandler({ storageConfig });
        this.storageHandler = storageHandler;

        storageHandler.validateConfig();

        console.log('Storage config valid!');
    }

    static createStorageConfigFile(extractedStorageConfig) {
        if (extractedStorageConfig.type === 'json') {
            let jsonConfigFileName;

            if (storageTypes.google === extractedStorageConfig.integrationType) {
                jsonConfigFileName = config.googleStorageConfig.keyFilename;
            } else if (storageTypes.amazon === extractedStorageConfig.integrationType) {
                jsonConfigFileName = config.amazonKeyFileName;
            } else {
                throw new Error(`Unsupported integration type "${extractedStorageConfig.integrationType}"`);
            }

            fs.writeFileSync(jsonConfigFileName, JSON.stringify(extractedStorageConfig.storageConfig));
        }
    }
}

module.exports = StorageConfigManager;
