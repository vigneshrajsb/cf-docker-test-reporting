const GoogleStorage = require('./google.storage');
const AmazonStorage = require('./amazon.storage');
const AzureBlobStorage = require('./azure.blob.storage');
const AzureFileStorage = require('./azure.file.storage');
const MinioStorage = require('./minio.storage');

const storageTypes = require('../storageTypes');

module.exports = {
    [storageTypes.google]: GoogleStorage,
    [storageTypes.amazon]: AmazonStorage,
    [storageTypes.azureBlob]: AzureBlobStorage,
    [storageTypes.azureFile]: AzureFileStorage,
    [storageTypes.minio]: MinioStorage
};
