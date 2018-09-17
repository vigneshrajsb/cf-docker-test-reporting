'use strict';

// Before run this test you must specify env variable STORAGE_CONFIG with json config and BUCKET_NAME

const chai = require('chai');
const fs = require('fs');

let main;
let generateReport;
const expect = chai.expect;

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

describe('Generate and push report', () => {

    before(() => {
        fs.writeFileSync('google.storage.config.json', process.env.STORAGE_CONFIG);

        const src = require('../src/main');
        main = src.main;
        generateReport = src.generateReport;
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

    it('should push report to cloud without error', async () => {
        try {
            await main('unit_test');
        } catch (e) {
            expect.fail(true, true, 'main function must work without throwing error');
        }
    });

    it('should generate report', async () => {
        const generation = generateReport();

        const generationPromise = new Promise((res) => {
            generation.on('exit', async (exitCode) => {
                if (exitCode !== 0) {
                    res(0);
                } else {
                    res(1);
                }
            });
        });

        const generationResult = await generationPromise;

        if (!generationResult) {
            expect.fail(true, true, 'fail to generate report');
        }
    });
});
