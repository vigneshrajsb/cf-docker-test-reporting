'use strict';

const storageTypes = require('../storageConfig/storageTypes');
const AmazonApi = require('./AmazonApi');
const GCSApi = require('./GSCApi');
const AzureApi = require('./AzureApi');

class StorageApi {
    static getApi(state) {
        const { extractedStorageConfig } = state;

        if (extractedStorageConfig.integrationType === storageTypes.amazon) {
            return new AmazonApi(state);
        } else if (extractedStorageConfig.integrationType === storageTypes.google) {
            return new GCSApi(state);
        } else if (extractedStorageConfig.integrationType === storageTypes.azure) {
            return new AzureApi(state);
        } else {
            const { name, type } = extractedStorageConfig;
            throw new Error(`Can't find suitable storage api for storage config name "${name}", type: "${type}"`);
        }
    }
}

module.exports = StorageApi;
