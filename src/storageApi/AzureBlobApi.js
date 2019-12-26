'use strict';

const Promise = require('bluebird');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const fs = require('fs');

const FULL_USER_PERMISSION = '0744';

class AzureBlobApi {
    constructor({ extractedStorageConfig }) {
        const { storageConfig: { accountName, accountKey } = {} } = extractedStorageConfig;
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName,
            accountKey);
        this.blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            sharedKeyCredential
        );
    }

    upload(opts) {
        return this._uploadFileToAzureStorage(opts);
    }

    async _uploadFileToAzureStorage({ bucketName, file, pathToDeploy }) {
        const containerClient = await this.blobServiceClient.getContainerClient(bucketName);
        if (!(await containerClient.exists())) {
            await containerClient.create();
        }
        const blockBlobClient = containerClient.getBlockBlobClient(pathToDeploy);
        return blockBlobClient.uploadFile(file);
    }

    downloadHistory(opts) {
        return this._downloadHistoryFromAzureStorage(opts);
    }

    async _downloadHistoryFromAzureStorage({ historyDir, config, buildData }) {
        const { env: { bucketName } = {} } = config;
        const containerClient = await this.blobServiceClient.getContainerClient(bucketName);
        const iter = await containerClient.listBlobsFlat(
            { prefix: `${buildData.pipelineId}/${config.env.branchNormalized}/${config.allureHistoryDir}/` });
        const promises = [];
        let blobItem = await iter.next();

        while (!blobItem.done) {
            const { value: { name } = {} } = blobItem;
            const blobClient = containerClient.getBlobClient(name);
            const promise = blobClient.download().then((response) => {
                return Promise.fromCallback(cb =>
                        fs.writeFile(`${historyDir}/${name}`,
                        response.readableStreamBody, { mode: FULL_USER_PERMISSION }, cb));
            });
            promises.push(promise);
            // eslint-disable-next-line no-await-in-loop
            blobItem = await iter.next();
        }
        return Promise.all(promises);
    }
}

module.exports = AzureBlobApi;
