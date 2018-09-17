'use strict';

const allureCmd = require('../cf-allure-commandline');
const recursiveReadSync = require('recursive-readdir-sync');
const config = require('../config');
const fs = require('fs');

/* json config wrapped in single quotes we need remove them before use config */
let content = fs.readFileSync(config.googleStorageConfig.keyFilename);
content = content.toString().replace(/'/gm, '');
fs.writeFileSync(config.googleStorageConfig.keyFilename, content);

const gcs = require('@google-cloud/storage')(config.googleStorageConfig);

function generateReport() {
    return allureCmd(['generate', 'allure-results', '--clean']);
}

exports.main = async (buildId) => { // eslint-disable-line
    console.log(`Start generating test report for build ${buildId}`);
    console.log(`Working directory: ${process.cwd()}`);

    const generation = generateReport();

    generation.on('exit', async (exitCode) => {
        if (exitCode === 0) {
            console.log('Report generation is finished successfully');
        } else {
            console.error('Report generation is fail, exit with code:', exitCode);
        }

        const bucket = gcs.bucket(config.bucketName);

        try {
            const files = await recursiveReadSync(config.resultReportFolderName);

            console.log('Start upload report files');

            files.forEach((f) => {
                const pathToDeploy = buildId + f.replace(config.resultReportFolderName, '');
                bucket.upload(f, { destination: pathToDeploy }, (err) => {
                    if (!err) {
                        console.log(`File ${pathToDeploy} successful uploaded`);
                    } else {
                        console.error(`Fail to upload file ${pathToDeploy}, error: `, err.message ? err.message : err);
                    }
                });
            });
        } catch (err) {
            if (err.errno === 34) {
                console.error('Path does not exist');
            } else {
                throw err;
            }
        }
    });
};

exports.generateReport = generateReport;
