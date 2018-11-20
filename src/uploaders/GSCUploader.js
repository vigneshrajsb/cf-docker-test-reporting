'use strict';

const fileManager = require('../FileManager');


class GCSUploader {
    static upload(opts) {
        return fileManager.uploadFiles(opts);
    }
}

module.exports = GCSUploader;
