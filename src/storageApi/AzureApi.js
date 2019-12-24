'use strict';

const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const fs = require('fs');

const FULL_USER_PERMISSION = '0744';

class AzureApi {
    constructor({ config }) {
        const sharedKeyCredential = new StorageSharedKeyCredential(config.accountName, config.accountKey);
        this.blobServiceClient = new BlobServiceClient(
            `https://${config.accountName}.blob.core.windows.net`,
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
        const bucketName = config.env.bucketName;
        const containerClient = await this.blobServiceClient.getContainerClient(bucketName);
        const iter = await containerClient.listBlobsFlat(
            { prefix: `${buildData.pipelineId}/${config.env.branchNormalized}/${config.allureHistoryDir}/` });
        const promises = [];
        let blobItem = await iter.next();
        while (!blobItem.done) {
            console.log(blobItem.value.name);
            const promise = new Promise((res, rej) => {
                const baseName = blobItem.value.name;
                const blobClient = containerClient.getBlobClient(baseName);
                blobClient.download().then((response) => {
                    fs.writeFile(`${historyDir}/${baseName}`,
                        response.readableStreamBody, { mode: FULL_USER_PERMISSION }, (e) => {
                            if (e) {
                                rej(e);
                            }

                            res(true);
                        });
                });
            });
            promises.push(promise);
            blobItem = await iter.next();
        }
        return Promise.all(promises);
    }
}

module.exports = AzureApi;
