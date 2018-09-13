'use strict';

const path = require('path');
const fs = require('fs');

const googleStorageCongigFile = 'google.storage.config.json';
const keyFilename = {
    'type': 'service_account',
    'project_id': process.env.PROJECT_ID,
    'private_key_id': process.env.PRIVATE_KEY_ID,
    'private_key': process.env.PRIVATE_KEY,
    'client_email': process.env.CLIENT_EMAIL,
    'client_id': process.env.CLIENT_ID,
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'client_x509_cert_url': process.env.CLIENT_CERT_URL
};

/* create json config which need to google cloud storage module */
fs.writeFileSync(googleStorageCongigFile, JSON.stringify(keyFilename, (key, value) => {
    /* if in env variable exists \n then we must handle converting this value to string
    * because by default it adds additional backslash
    */
    if (key === 'private_key') {
        return String(value).replace(/\\n/g, '\n');
    } else {
        return value;
    }
}, 2));

module.exports = {
    googleStorageConfig: {
        projectId: 'local-codefresh',
        keyFilename: path.resolve(__dirname, googleStorageCongigFile)
    },
    resultReportFolderName: 'allure-report',
    bucketName: 'pasha-codefresh'
};