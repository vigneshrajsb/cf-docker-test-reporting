'use strict';

/* eslint no-proto: 0 */

const expect = require('chai').expect;
const StorageConfigProvider = require('../StorageConfigProvider');
const FileManager = require('../../FileManager');
const Config = require('../../../config');

const config = Config.getConfig();


describe('Storage provider', () => {

    after(async () => {
        /**
         * clear files with creds which was created during tests
         */
        await FileManager.removeResource(config.googleStorageConfig.keyFilename);
        await FileManager.removeResource(config.amazonKeyFileName);
    });

    const storageConfAuth = {
        'apiVersion': 'v1',
        'kind': 'context',
        'owner': 'account',
        'metadata': {
            'default': false,
            'system': false,
            'name': 'google'
        },
        'spec': {
            'type': 'storage.gc',
            'data': {
                'sharingPolicy': 'AllUsersInAccount',
                'auth': {
                    'type': 'oauth2',
                    'idpId': '5b7018a3c3567008431464d6',
                    'accessToken': 'testAccessToken',
                    'permissions': [
                        'readWrite'
                    ],
                    'refreshToken': 'testRefreshToken',
                    'expires': 1542020063430
                }
            }
        }
    };

    const storageConfAuthExtacted = {
        'type': 'oauth2',
        'idpId': '5b7018a3c3567008431464d6',
        'accessToken': 'testAccessToken',
        'permissions': [
            'readWrite'
        ],
        'refreshToken': 'testRefreshToken',
        'expires': 1542020063430
    };

    const storageConfBasic = {
        'apiVersion': 'v1',
        'kind': 'context',
        'owner': 'account',
        'metadata': {
            'default': false,
            'system': false,
            'name': 'json'
        },
        'spec': {
            'type': 'storage.gc',
            'data': {
                'sharingPolicy': 'AllUsersInAccount',
                'auth': {
                    'type': 'basic',
                    'jsonConfig': {
                        'type': 'service_account',
                        'project_id': 'local-codefresh',
                        'private_key_id': 'testPrivateKeyId',
                        'private_key': 'testPrivateKey',
                        'client_email': 'testEmail',
                        'client_id': 'testClientId',
                        'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                        'token_uri': 'https://oauth2.googleapis.com/token',
                        'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
                        'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/gcs-17%40local-codefresh.iam.gserviceaccount.com'
                    }
                }
            }
        }
    };

    const storageConfBasicExtacted = {
        'type': 'service_account',
        'project_id': 'local-codefresh',
        'private_key_id': 'testPrivateKeyId',
        'private_key': 'testPrivateKey',
        'client_email': 'testEmail',
        'client_id': 'testClientId',
        'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
        'token_uri': 'https://oauth2.googleapis.com/token',
        'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
        'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/gcs-17%40local-codefresh.iam.gserviceaccount.com'
    };

    const storageConfAmazonBasic = {
        'apiVersion': 'v1',
        'kind': 'context',
        'owner': 'account',
        'metadata': {
            'default': false,
            'system': false,
            'name': 's3Test'
        },
        'spec': {
            'type': 'storage.s3',
            'data': {
                'sharingPolicy': 'AllUsersInAccount',
                'auth': {
                    'type': 'basic',
                    'jsonConfig': {
                        'accessKeyId': 'fakeAccessKeyId',
                        'secretAccessKey': 'fakeSecretAccessKey'
                    }
                }
            }
        }
    };

    const storageConfAzureBlob = {
        'apiVersion': 'v1',
        'kind': 'context',
        'owner': 'account',
        'metadata': {
            'default': false,
            'system': false,
            'name': 'azureBlobTest'
        },
        'spec': {
            'type': 'storage.azb',
            'data': {
                'sharingPolicy': 'AllUsersInAccount',
                'auth': {
                    'type': 'basic',
                    'jsonConfig': {
                        'accountName': 'fakeAccountName',
                        'accountKey': 'fakeAccountKey'
                    }
                }
            }
        }
    };

    const storageConfAzureBlobExtracted = {
        'accountName': 'fakeAccountName',
        'accountKey': 'fakeAccountKey'
    };

    const storageConfAmazonBasicExtracted = {
        'accessKeyId': 'fakeAccessKeyId',
        'secretAccessKey': 'fakeSecretAccessKey'
    };

    it('provide config for gcs auth storage', async () => {
        const storageConfigProvider = new StorageConfigProvider({ config });
        storageConfigProvider.__proto__._getStorageConfig = function () {
            this.storageConfig = JSON.stringify(storageConfAuth);
        };
        expect(await storageConfigProvider.provide({ config })).to.deep.equal({
            integrationType: 'storage.gc',
            name: 'google',
            storageConfig: storageConfAuthExtacted,
            type: 'auth',
        });
    });

    it('provide config for gcs basic storage', async () => {
        const storageConfigProvider = new StorageConfigProvider({ config });
        storageConfigProvider.__proto__._getStorageConfig = function () {
            this.storageConfig = JSON.stringify(storageConfBasic);
        };
        expect(await storageConfigProvider.provide({ config })).to.deep.equal({
            integrationType: 'storage.gc',
            name: 'json',
            storageConfig: storageConfBasicExtacted,
            type: 'json'
        });
    });

    it('provide config for amazon basic storage', async () => {
        const storageConfigProvider = new StorageConfigProvider({ config });
        storageConfigProvider.__proto__._getStorageConfig = function () {
            this.storageConfig = JSON.stringify(storageConfAmazonBasic);
        };
        expect(await storageConfigProvider.provide({ config })).to.deep.equal({
            integrationType: 'storage.s3',
            name: 's3Test',
            storageConfig: storageConfAmazonBasicExtracted,
            type: 'json'
        });
    });

    it('provide config for azure blob storage', async () => {
        const storageConfigProvider = new StorageConfigProvider({ config });
        storageConfigProvider.__proto__._getStorageConfig = function () {
            this.storageConfig = JSON.stringify(storageConfAzureBlob);
        };
        expect(await storageConfigProvider.provide({ config })).to.deep.equal({
            integrationType: 'storage.azb',
            name: 'azureBlobTest',
            storageConfig: storageConfAzureBlobExtracted,
            type: 'json'
        });
    });
});
