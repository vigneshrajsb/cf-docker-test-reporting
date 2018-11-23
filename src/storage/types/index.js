'use strict';

const GoogleStorage = require('./googleStorage');
const AmazonStorage = require('./amazonStorage');

module.exports = {
    [GoogleStorage.getType()]: GoogleStorage,
    [AmazonStorage.getType()]: AmazonStorage
};
