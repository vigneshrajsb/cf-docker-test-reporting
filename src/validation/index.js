const fs = require('fs');
const FileManager = require('../FileManager');
const _ = require('lodash');

class Validator {
    static async validateUploadDir({ config }, pathToDir) {
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
    static async validateUploadFile({ config }) {
        const pathToFile = config.env.reportIndexFile;

        if (!fs.existsSync(pathToFile)) {
            throw new Error('Error: File for upload does not exist. \n' +
            'Ensure that "working_directory" was specified for this step and it contains the file for upload');
        }

        if (config.uploadMaxSize < await FileManager.getDirOrFileSize(pathToFile)) {
            throw new Error(`Error: File for upload is to large, max size is ${config.uploadMaxSize} MB`);
        }

        return true;
    }

    static validateUploadResource({ isUploadFile, config }, pathToDir) {
        if (isUploadFile) {
            return this.validateUploadFile({ config });
        } else {
            return this.validateUploadDir({ config }, pathToDir);
        }
    }

    static validateBuildData({ buildData, config }) {
        const signature = config.buildDataSignature;
        if (!_.isObject(buildData)) {
            throw new Error('Error, buildData must be object');
        }

        Object.keys(signature).forEach((key) => {
            if (buildData[key] && typeof buildData[key] !== signature[key].type) { // eslint-disable-line
                throw new Error(`Error validate extra data, field ${key} have wrong type`);
            }

            if (signature[key].required && !buildData[key]) {
                throw new Error(`Error validate extra data, field ${key} is required`);
            }
        });
    }

    static validateRequiredVars({ config }) {
        const requiredVars = config.requiredVarsForUploadMode;
        const missingVars = [];

        Object.keys(requiredVars).forEach((varName) => {
            if (!requiredVars[varName]) {
                missingVars.push(varName);
            }
        });

        if (missingVars.length) {
            throw new Error(`Error, missing required variable${missingVars.length > 1 ? 's' : ''}:${missingVars.join(', ')}`);
        }
    }
}

module.exports = Validator;
