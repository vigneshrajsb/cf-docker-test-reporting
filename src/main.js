
const allure = require('allure-commandline');
const recursiveReadSync = require('recursive-readdir-sync');
const path = require('path');


const config = {
    projectId: 'local-codefresh',
    keyFilename: path.resolve(__dirname, 'local-codefresh-edb26332ca27.json')
};

const gcs = require('@google-cloud/storage')(config);

const REPORT_FOLDER_NAME = "allure-report";
const BUCKET_NAME = 'pasha-codefresh';

exports.main = async (buildId) => {

    console.log("RUN TEST GENERATION");

    console.log("PATH: " + process.cwd());

    const generation = allure(['generate', "allure-results", "--clean"]);

    generation.on('exit', async (exitCode) => {
        console.log('Generation is finished with code:', exitCode);

        const bucket = gcs.bucket(BUCKET_NAME);

        try {
            const files = await recursiveReadSync(REPORT_FOLDER_NAME);
            files.forEach(f => {
                const pathToDeploy = buildId + f.replace(REPORT_FOLDER_NAME, '');
                bucket.upload(f, { destination: pathToDeploy }, (err, file) => {
                    if (!err) {
                        console.log(`File ${pathToDeploy} sucessfull uploaded`);
                    }
                    else {
                        console.error(err);
                    }

                });
            });
            console.log(files);
        } catch(err){
            if(err.errno === 34){
                console.log('Path does not exist');
            } else {
                //something unrelated went wrong, rethrow
                throw err;
            }
        }
    });


};
