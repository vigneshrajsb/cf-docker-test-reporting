const Minio = require('minio');

class MinioApi {
    constructor({ extractedStorageConfig }) {
        this.minioClient = new Minio.Client({
            endPoint: extractedStorageConfig.endpoint,
            port: extractedStorageConfig.port,
            useSSL: extractedStorageConfig.useSSL,
            accessKey: extractedStorageConfig.accessKey,
            secretKey: extractedStorageConfig.secretKey
        });
    }

    upload(opts) {
        return this._uploadFile(opts);
    }

    _uploadFile({ bucketName, file, pathToDeploy }) {
        const metadata = {
            'Content-Type': 'application/octet-stream'
        };

        return new Promise((res, rej) => {
            // eslint-disable-next-line consistent-return
            this.minioClient.fPutObject(bucketName, pathToDeploy, file, metadata, (err) => {
                if (err) return rej(err);
                res();
            });
        });
    }

}

module.exports = MinioApi;
