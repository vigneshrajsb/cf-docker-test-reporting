const path = require('path');

module.exports = {
    googleStorageConfig: {
        projectId: 'local-codefresh',
        keyFilename: path.resolve(__dirname, 'local-codefresh-edb26332ca27.json')
    },
    resultReportFolderName: 'allure-report',
    bucketName: 'pasha-codefresh'
};