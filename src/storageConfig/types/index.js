'use strict';

const GoogleStorage = require('./googleStorage');
const AmazonStorage = require('./amazonStorage');
const AzureBlobStorage = require('./azureBlobStorage');
const AzureFileStorage = require('./azureFileStorage');

module.exports = {
    [GoogleStorage.getType()]: GoogleStorage,
    [AmazonStorage.getType()]: AmazonStorage,
    [AzureBlobStorage.getType()]: AzureBlobStorage,
    [AzureFileStorage.getType()]: AzureFileStorage,
};
