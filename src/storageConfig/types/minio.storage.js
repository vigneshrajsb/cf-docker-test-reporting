const BasicStorage = require('./basic.storage');
const _ = require('lodash');
const { minio } = require('../storageTypes');

class MinioStorage extends BasicStorage {
    constructor({ storageConfig }) {
        super(storageConfig);
    }

    extractStorageConfig() {
        this.extractedConfig = {
            type: 'auth',
            integrationType: minio,
            name: _.get(this.storageConfig, 'metadata.name'),
            endpoint: _.get(this.storageConfig, 'spec.data.spec.data.endpoint'),
            port: _.get(this.storageConfig, 'spec.data.spec.data.port'),
            useSSL: _.get(this.storageConfig, 'spec.data.spec.data.useSSL'),
            accessKey: _.get(this.storageConfig, 'spec.data.spec.data.accessKey'),
            secretKey: _.get(this.storageConfig, 'spec.data.spec.data.secretKey'),
        };
    }

    validateConfig() {
        return true;
    }

}

module.exports = MinioStorage;
