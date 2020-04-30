const _ = require('lodash');

class BasicStorage {
    constructor(storageConfig) {
        this.storageConfig = storageConfig;
    }

    isStorageJsonConfigUsed() {
        return _.get(this.storageConfig, 'spec.data.auth.type') !== 'oauth2';
    }
}

module.exports = BasicStorage;
