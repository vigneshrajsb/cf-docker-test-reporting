const Minio = require('minio');

class MinioApi {
    constructor({ config }) {
        this.minioClient = new Minio.Client({
            endPoint: '127.0.0.1',
            port: 9000,
            useSSL: false,
            accessKey: 'minioadmin',
            secretKey: 'minioadmin'
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
