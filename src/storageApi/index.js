'use strict';

const storageTypes = require('../storageConfig/storageTypes');
const AmazonApi = require('./AmazonApi');
const GCSApi = require('./GSCApi');

class StorageApi {
    static getApi(opts) {
        if (opts.extractedStorageConfig.integrationType === storageTypes.amazon) {
            return new AmazonApi();
        } else if (opts.extractedStorageConfig.integrationType === storageTypes.google) {
            return new GCSApi(opts);
        } else {
            const { name, type } = opts.extractedStorageConfig;
            throw new Error(`Can't find suitable storage api for storage config name "${name}", type: "${type}"`);
        }
    }
}

module.exports = StorageApi;
