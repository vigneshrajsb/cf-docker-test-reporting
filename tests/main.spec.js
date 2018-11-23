'use strict';

// Before run this test you must specify env variables CF_STORAGE_INTEGRATION and BUCKET_NAME

const chai = require('chai');
const fs = require('fs');
const config = require('../config');
const StorageConfigProvider = require('../src/storage/StorageConfigProvider');

const expect = chai.expect;

process.exit = () => 0;

const sourceReportFolder = 'allure-results';
const resultReportFolder = 'allure-report';

const deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const curPath = `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

function setEnvVariables(varsObj) {
    Object.keys(varsObj).forEach(function (key) {
        process.env[key] = varsObj[key];
    });
}

function clearEnvVariables() {
    delete process.env.CLEAR_TEST_REPORT;
    delete process.env.REPORT_DIR;
    delete process.env.REPORT_INDEX_FILE;
}

describe('Test reporting logic', function () {
    describe('Upload report', function () {

        this.timeout(20000);

        before(() => {
            setEnvVariables({
                CF_VOLUME_PATH: 'fakeVolume',
                CF_BUILD_ID: '5bb328cb60275d6c1f8c891c'
            });

            if (!fs.existsSync(process.env.CF_VOLUME_PATH)) {
                fs.mkdirSync(process.env.CF_VOLUME_PATH, '0744');
                fs.writeFileSync(`${process.env.CF_VOLUME_PATH}/env_vars_to_export`, '');
            }
        });


        // create test source report
        beforeEach(() => {
            clearEnvVariables();

            if (fs.existsSync(resultReportFolder)) {
                deleteFolderRecursive(resultReportFolder);
            }

            if (!fs.existsSync(sourceReportFolder)) {
                fs.mkdirSync(sourceReportFolder, '0744');
            }

            fs.writeFileSync(`${sourceReportFolder}/0959780b-46b0-4731-9202-71bf34433d1c-testsuite.xml`, `<?xml version='1.0'?>
<ns2:test-suite xmlns:ns2='urn:model.allure.qatools.yandex.ru' start='1536739453738' stop='1536739455242'>
    <name>sanity tests</name>
    <title>sanity tests</title>
    <test-cases>
        <test-case start='1536739453739' status='passed' stop='1536739455240'>
            <name>test mongo connection</name>
            <title>test mongo connection</title>
            <labels/>
            <parameters/>
            <steps/>
            <attachments/>
        </test-case>
    </test-cases>
</ns2:test-suite>`);
        });

        afterEach(() => {
            if (fs.existsSync(sourceReportFolder)) {
                deleteFolderRecursive(sourceReportFolder);
            }

            if (fs.existsSync(resultReportFolder)) {
                deleteFolderRecursive(resultReportFolder);
            }
        });

        after(() => {
            fs.unlinkSync('google.storage.config.json');
        });

        it('should generate and upload allure report', async function () {
            const initReporter = require('../src/init');
            const result = await initReporter();
            expect(result).to.be.true;
        });

        it('should generate and upload allure report with custom name', async function () {
            // this test overides allure-results folder name and default allure source dir name
            // after test this values must be restored

            const customAllureDir = 'allure-results-test';
            config.sourceReportFolderName = customAllureDir;

            fs.renameSync(`${process.cwd()}/allure-results`, `${process.cwd()}/${customAllureDir}`);

            setEnvVariables({ ALLURE_DIR: customAllureDir });
            const initReporter = require('../src/init');
            const result = await initReporter();

            config.sourceReportFolderName = 'allure-results';

            if (fs.existsSync(customAllureDir)) {
                deleteFolderRecursive(customAllureDir);
            }

            expect(result, 'fail during upload custom allure').to.be.true;
        });

        it('should upload custom report', async function () {
            if (!fs.existsSync('testUploadDir')) {
                fs.mkdirSync('testUploadDir', '0744');
                fs.writeFileSync('testUploadDir/test.txt', 'some data');
            }

            setEnvVariables({ REPORT_INDEX_FILE: 'test.txt', REPORT_DIR: 'testUploadDir' });
            const initReporter = require('../src/init');
            const result = await initReporter();
            expect(result).to.be.true;
        });

        it('should remove test dir after upload', async function () {
            if (!fs.existsSync('testUploadDir')) {
                fs.mkdirSync('testUploadDir', '0744');
                fs.writeFileSync('testUploadDir/test.txt', 'some data');
            }

            setEnvVariables({ REPORT_INDEX_FILE: 'test.txt', REPORT_DIR: 'testUploadDir', CLEAR_TEST_REPORT: true });
            const initReporter = require('../src/init');
            const result = await initReporter();
            expect(result).to.be.true;
            expect(fs.existsSync('testUploadDir')).to.be.false;
        });

        it('should upload one file', async function () {
            if (!fs.existsSync('testUploadDir')) {
                fs.mkdirSync('testUploadDir', '0744');
                fs.writeFileSync('testUploadDir/test.txt', 'some data');
            }

            setEnvVariables({ REPORT_INDEX_FILE: 'testUploadDir/test.txt' });
            const initReporter = require('../src/init');
            const result = await initReporter();

            expect(result).to.be.true;
        });
    });

    describe('Storage provider', function () {
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
            "apiVersion": "v1",
            "kind": "context",
            "owner": "account",
            "metadata": {
                "default": false,
                "system": false,
                "name": "s3Test"
            },
            "spec": {
                "type": "storage.s3",
                "data": {
                    "sharingPolicy": "AllUsersInAccount",
                    "auth": {
                        "type": "basic",
                        "jsonConfig": {
                            "accessKeyId": "fakeAccessKeyId",
                            "secretAccessKey": "fakeSecretAccessKey"
                        }
                    }
                }
            }
        };

        const storageConfAmazonBasicExtracted = {
            "accessKeyId": "fakeAccessKeyId",
            "secretAccessKey": "fakeSecretAccessKey"
        };

        it('provide config for gcs auth storage', async () => {
            const storageConfigProvider = new StorageConfigProvider();
            storageConfigProvider.__proto__._getStorageConfig = function () {
                this.storageConfig = JSON.stringify(storageConfAuth);
            };
            expect(await storageConfigProvider.provide()).to.deep.equal({
                integrationType: 'storage.gc',
                name: 'google',
                storageConfig: storageConfAuthExtacted,
                type: 'auth',
            });
        });

        it('provide config for gcs basic storage', async () => {
            const storageConfigProvider = new StorageConfigProvider();
            storageConfigProvider.__proto__._getStorageConfig = function () {
                this.storageConfig = JSON.stringify(storageConfBasic);
            };
            expect(await storageConfigProvider.provide()).to.deep.equal({
                integrationType: 'storage.gc',
                name: 'json',
                storageConfig: storageConfBasicExtacted,
                type: 'json'
            });
        });

        it('provide config for amazon basic storage', async () => {
            const storageConfigProvider = new StorageConfigProvider();
            storageConfigProvider.__proto__._getStorageConfig = function () {
                this.storageConfig = JSON.stringify(storageConfAmazonBasic);
            };
            expect(await storageConfigProvider.provide()).to.deep.equal({
                integrationType: 'storage.s3',
                name: 's3Test',
                storageConfig: storageConfAmazonBasicExtracted,
                type: 'json'
            });
        });
    });
});
