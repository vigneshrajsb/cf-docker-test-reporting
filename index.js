'use strict';

/* eslint global-require: 0 */

function validateRequiredVars() {
    if (!process.env.BUCKET_NAME) {
        throw new Error('This service require BUCKET_NAME variable');
    }
}

async function startReporter() {
    try {
        validateRequiredVars();

        const init = require('./src/init');

        init();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

startReporter();
