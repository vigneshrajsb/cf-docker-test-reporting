'use strict';

// Before run this test you must specify env variables GCS_CONFIG with json config and BUCKET_NAME

const chai = require('chai');
const fs = require('fs');

const should = chai.should;
should();

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

function setEnvVariables(varsObj){
    Object.keys(varsObj).forEach(function (key) {
        process.env[key] = varsObj[key];
    });
}

describe('Test reporting logic', function () {

    this.timeout(10000);

    before(() => {
        setEnvVariables({
            CF_VOLUME_PATH: 'fakeVolume',
            CF_BUILD_ID: '5bb328cb60275d6c1f8c891c'
        });

        fs.writeFileSync('google.storage.config.json', process.env.GCS_CONFIG);

        if (!fs.existsSync(process.env.CF_VOLUME_PATH)) {
            fs.mkdirSync(process.env.CF_VOLUME_PATH, '0744');
            fs.writeFileSync(`${process.env.CF_VOLUME_PATH}/env_vars_to_export`, '');
        }
    });


    // create test source report
    beforeEach(() => {
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
        result.should.be.true;
    });

    it('should upload custom report', async function () {
        const initReporter = require('../src/init');
        setEnvVariables({ UPLOAD_DIR_INDEX_FILE: 'main.spec.js', UPLOAD_DIR: 'tests' });
        const result = await initReporter();
        result.should.be.true;
    });
});
