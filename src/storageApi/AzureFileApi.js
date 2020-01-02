'use strict';

const Promise = require('bluebird');
const { Aborter, DirectoryURL, FileURL, ServiceURL, ShareURL,
    SharedKeyCredential, StorageURL, uploadFileToAzureFile } = require('@azure/storage-file');
const fs = require('fs');
const logger = require('../logger');

const FULL_USER_PERMISSION = '0744';


class AzureFileApi {
    constructor({ extractedStorageConfig }) {
        const { storageConfig: { accountName, accountKey } = {} } = extractedStorageConfig;
        const sharedKeyCredential = new SharedKeyCredential(accountName,
            accountKey);
        const pipeline = StorageURL.newPipeline(sharedKeyCredential);
        this.serviceURL = new ServiceURL(
            `https://${accountName}.file.core.windows.net`,
            pipeline
        );
    }

    upload(opts) {
        return this._uploadFileToAzureStorage(opts);
    }

    async _uploadFileToAzureStorage({ bucketName, file, pathToDeploy }) {

        const splitedPath = pathToDeploy.split('/');
        const splitedFoldersPath = splitedPath.slice(0, -1);
        const fileName = splitedPath.pop();
        const shareURL = await this._createShareUrl(bucketName);
        let dirUrl;
        let path = '';
        for (const folder of splitedFoldersPath) {
            path += folder;
            // eslint-disable-next-line no-await-in-loop
            dirUrl = await this._createDir(shareURL, path);
            path += '/';
        }
        const fileUrl = FileURL.fromDirectoryURL(dirUrl, fileName);
        await uploadFileToAzureFile(Aborter.none, file, fileUrl);
        return fileUrl;
    }

    async _createShareUrl(bucketName) {
        const shareUrl = ShareURL.fromServiceURL(this.serviceURL, bucketName);
        try {
            await shareUrl.create(Aborter.none);
        } catch (err) {
            if (err.body && err.body.Code !== 'ShareAlreadyExists') {
                throw err;
            }
        }

        return shareUrl;
    }

    downloadHistory(opts) {
        return this._downloadHistoryFromAzureStorage(opts);
    }

    async _createDir(azureUrl, dirName) {
        const directoryUrl = DirectoryURL.fromDirectoryURL(azureUrl, dirName);
        try {
            await directoryUrl.create(Aborter.none);
        } catch (err) {
            if (err.body && err.body.Code !== 'ResourceAlreadyExists') {
                throw err;
            }
        }

        return directoryUrl;
    }

    async _downloadHistoryFromAzureStorage({ historyDir, config, buildData }) {
        const { env: { bucketName } = {} } = config;
        const shareURL = ShareURL.fromServiceURL(this.serviceURL, bucketName);
        const directoryURL = DirectoryURL.fromShareURL(shareURL,
            `${buildData.pipelineId}/${config.env.branchNormalized}/${config.allureHistoryDir}`);
        const promises = [];
        try {
            const directory = await directoryURL.listFilesAndDirectoriesSegment();
            directory.segment.fileItems.forEach((file) => {
                const fileURL = FileURL.fromDirectoryURL(directoryURL, file.name);
                const promise = fileURL.download(Aborter.none, 0).then((response) => {
                    return Promise.fromCallback(cb =>
                        fs.writeFile(`${historyDir}/${file.name}`,
                            response.readableStreamBody, { mode: FULL_USER_PERMISSION }, cb));
                });
                promises.push(promise);
            });
        } catch (e) {
            logger.error(e);
        }

        return Promise.all(promises);
    }
}

module.exports = AzureFileApi;
