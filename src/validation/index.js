'use strict';

const fs = require('fs');
const config = require('../../config');
const FileManager = require('../FileManager');

class Validator {
    static async validateUploadDir(pathToDir) {
        if (!fs.existsSync(pathToDir)) {
            throw new Error('Error: Directory for upload does not exist. \n' +
            'Ensure that "working_directory" was specified for this step and it contains the directory for upload');
        }

        if (!fs.readdirSync(pathToDir).length) {
            throw new Error('Error: Directory for upload is empty');
        }

        if (config.uploadMaxSize < await FileManager.getDirOrFileSize(pathToDir)) {
            throw new Error(`Error: Directory for upload is to large, max size is ${config.uploadMaxSize} MB`);
        }

        return true;
    }

    // invokes only when user want to upload one file
    static async validateUploadFile(pathToFile) {
        if (!fs.existsSync(pathToFile)) {
            throw new Error('Error: FIle for upload does not exist. \n' +
            'Ensure that "working_directory" was specified for this step and it contains the file for upload');
        }

        if (config.uploadMaxSize < await FileManager.getDirOrFileSize(pathToFile)) {
            throw new Error(`Error: File for upload is to large, max size is ${config.uploadMaxSize} MB`);
        }

        return true;
    }

    static validateUploadResource({ isUploadFile, uploadIndexFile, dirForUpload }) {
        if (isUploadFile) {
            return this.validateUploadFile(uploadIndexFile);
        } else {
            return this.validateUploadDir(dirForUpload);
        }
    }
}

module.exports = Validator;
