'use strict';

const GoogleStorage = require('./googleStorage');
const AmazonStorage = require('./amazonStorage');
const AzureStorage = require('./azureStorage');

module.exports = {
    [GoogleStorage.getType()]: GoogleStorage,
    [AmazonStorage.getType()]: AmazonStorage,
    [AzureStorage.getType()]: AzureStorage
};
