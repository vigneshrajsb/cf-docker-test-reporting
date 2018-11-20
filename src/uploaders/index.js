'use strict';

const storageTypes = require('../storage/storageTypes');
const GCSUploader = require('./GSCUploader');
const AmazonUploader = require('./AmazonUploader');

module.exports = {
    [storageTypes.google]: GCSUploader,
    [storageTypes.amazon]: AmazonUploader
};