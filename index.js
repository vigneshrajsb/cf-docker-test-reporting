'use strict';

const TestReporter = require('./src/main.js');

const testReporter = new TestReporter({
    buildId: process.env.BUILD_ID,
    dirForUpload: process.env.UPLOAD_DIR,
    uploadIndexFile: process.env.UPLOAD_DIR_INDEX_FILE,
    volumePath: process.env.VOLUME_PATH
});

async function init() {
    try {
        await testReporter.start();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

init();

