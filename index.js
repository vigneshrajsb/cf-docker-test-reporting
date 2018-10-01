'use strict';

const BasicTestReporter = require('./src/BasicTestReporter');

const basicTestReporter = new BasicTestReporter();

async function init() {
    try {
        await basicTestReporter.start();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

init();

