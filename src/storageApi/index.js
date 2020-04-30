const storageTypes = require('../storageConfig/storageTypes');
const AmazonApi = require('./AmazonApi');
const GCSApi = require('./GSCApi');
const AzureBlobApi = require('./AzureBlobApi');
const AzureApi = require('./AzureFileApi');
const MinioApi = require('./MinioApi');

class StorageApi {
    static getApi(state) {
        const { extractedStorageConfig } = state;
        const apis = {
            [storageTypes.amazon]: AmazonApi,
            [storageTypes.google]: GCSApi,
            [storageTypes.azureBlob]: AzureBlobApi,
            [storageTypes.azureFile]: AzureApi,
            [storageTypes.minio]: MinioApi,
        };
        if (apis[extractedStorageConfig.integrationType]) {
            return new apis[extractedStorageConfig.integrationType](state);
        }
        const { name, type } = extractedStorageConfig;
        throw new Error(`Can't find suitable storage api for storage config name "${name}", type: "${type}"`);
    }
}

module.exports = StorageApi;
