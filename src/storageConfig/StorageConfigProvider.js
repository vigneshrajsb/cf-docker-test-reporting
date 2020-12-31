const _ = require('lodash');
const rp = require('request-promise');
const VariableResolver = require('../ variableResolver/VariableResolver');
const storageTypesMap = require('./types');
const storageTypes = require('./storageTypes');
const fs = require('fs');

class StorageConfigProvider {
    constructor({ config }) {
        this.integrationName = config.env.storageIntegration;
        this.variableResolver = new VariableResolver({ config });
    }

    async provide({ config }) {
        const storageConfig = await this._getStorageConfig({ config });
        await this._validateStorageConfig(storageConfig);
        await this._extractStorageConfig();
        await this._createStorageConfigFile({ config });

        return this.extractedStorageConfig;
    }

    async _getStorageConfig({ config }) {
        const opts = {
            uri: `${config.apiHost}/api/contexts/${config.env.storageIntegration}/prepare`,
            headers: {
                'Authorization': config.env.apiKey
            }
        };

        try {
            return await rp(opts);
        } catch (e) {
            const infoErrMsg = `Can't get storage integration: ${this.integrationName}`;
            if (config.env.logLevel === config.logLevels.DEBUG) {
                console.log(infoErrMsg);
                throw e;
            }
            throw new Error(infoErrMsg);
        }
    }

    _getStorageTypeHandler(storageConfig) {
        return storageTypesMap[_.get(storageConfig, 'spec.type')];
    }

    _parseStorageConfig(storageConfig) {
        let parsedConfig;

        try {
            parsedConfig = JSON.parse(storageConfig);

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

    async _validateStorageConfig(config) {
        console.log('Starting validate storage config');

        if (!this.integrationName) {
            throw new Error('This service requires integration with some storage, you can specify storage via CF_STORAGE_INTEGRATION'); // eslint-disable-line
        }

        let storageConfig = this._parseStorageConfig(config);
        storageConfig = await this.variableResolver.resolve(storageConfig);

        console.log(JSON.parse(storageConfig));

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

    _createStorageConfigFile({ config }) {
        if (this.extractedStorageConfig.type === 'json') {
            let jsonConfigFileName;

            if (storageTypes.google === this.extractedStorageConfig.integrationType) {
                jsonConfigFileName = config.googleStorageConfig.keyFilename;
            } else if (storageTypes.amazon === this.extractedStorageConfig.integrationType) {
                jsonConfigFileName = config.amazonKeyFileName;
            } else if (storageTypes.azureBlob === this.extractedStorageConfig.integrationType) {
                jsonConfigFileName = config.azureBlobKeyFileName;
            } else if (storageTypes.azureFile === this.extractedStorageConfig.integrationType) {
                jsonConfigFileName = config.azureKeyFileName;
            } else {
                throw new Error(`Unsupported integration type "${this.extractedStorageConfig.integrationType}"`);
            }

            fs.writeFileSync(jsonConfigFileName, JSON.stringify(this.extractedStorageConfig.storageConfig));
        }
    }
}

module.exports = StorageConfigProvider;
