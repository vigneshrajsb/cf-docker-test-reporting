const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const FULL_USER_PERMISSION = '0744';

class AmazonApi {
    constructor({ config }) {
        AWS.config.loadFromPath(config.amazonKeyFileName);
        this.s3 = new AWS.S3({ signatureVersion: 'v4' });
    }

    upload(opts) {
        return this._uploadFileToAmazon(opts);
    }

    _uploadFileToAmazon({ bucketName, file, pathToDeploy }) {
        const params = {
            Bucket: bucketName,
            Key: pathToDeploy,
            Body: fs.createReadStream(file)
        };

        return new Promise((res, rej) => {
            this.s3.upload(params, (err) => {
                if (err) {
                    rej(err);
                } else {
                    res();
                }
            });
        });
    }

    downloadHistory(opts) {
        return this._downloadHistoryFromAmazon(opts);
    }

    async _downloadHistoryFromAmazon({ historyDir, config, buildData }) {
        const bucketName = config.env.bucketName;

        const getListOpts = {
            Bucket: bucketName,
            Prefix: `${buildData.pipelineId}/${config.env.branchNormalized}/${config.allureHistoryDir}`,
        };

        const { Contents } = await new Promise((res, rej) => {
            this.s3.listObjects(getListOpts, (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    res(data);
                }
            });
        });

        const promises = Contents.map(({ Key }) => {
            const baseName = path.basename(Key);

            return new Promise((res, rej) => {
                const params = {
                    Bucket: bucketName,
                    Key
                };

                this.s3.getObject(params, (err, data) => {
                    if (err) {
                        rej(err);
                    } else {
                        fs.writeFile(`${historyDir}/${baseName}`, data.Body, { mode: FULL_USER_PERMISSION }, (e) => {
                            if (e) {
                                rej(e);
                            }

                            res(true);
                        });
                    }
                });
            });
        });

        return Promise.all(promises);
    }
}

module.exports = AmazonApi;
