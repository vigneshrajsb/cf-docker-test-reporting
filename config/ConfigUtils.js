'use strict';

const _ = require('lodash');

const FIND_VAR_INDEX = /\d{1,2}$/;
const FIND_VAR_INDEX_WITH_DOT = /\.\d{1,2}$/;

class ConfigUtils {
    static buildApiHost() {
        const isProd = !_.get(process.env, 'CF_HOST_NAME', '').includes('local');
        return `${isProd ? 'https' : 'http'}://${isProd ? 'g.codefresh.io' : 'local.codefresh.io'}`;
    }

    static getBucketName() {
        /**
         * return only bucket name without subpath
         */
        const bucketNameSplitted = String(process.env.BUCKET_NAME).split('/');
        return bucketNameSplitted[0];
    }

    static getBucketSubPath() {
        /**
         * bucketName can contain path that must be root of where report will be uploaded
         * return subpath extracted from bucket
         */
        const bucketNameSplitted = String(process.env.BUCKET_NAME).split('/');
        const bucketSubPath = bucketNameSplitted.slice(1).join('/');
        return bucketSubPath ? `${bucketSubPath}/` : bucketSubPath;
    }

    static getReportWrapDir() {
        /**
         * during multiupload we need to put each report inside individual folder,
         * REPORT_WRAP_DIR - name of folder in which will be uploaded files
         * exists only when multireports uploads
         */

        let reportWrapDir = '';
        if (process.env.REPORT_WRAP_DIR) {
            reportWrapDir = process.env.REPORT_WRAP_DIR;
        }

        return reportWrapDir;
    }

    static getMultiReportUpload(uploadVars) {
        /**
         * getMultiReportUpload - must return array of objects if array vars exists or undefined
         * uploadVars - env vars related to upload resource
         */
        const resultVars = [];

        Object.keys(process.env).forEach((envVar) => {
            uploadVars.forEach((uploadVar) => {
                /**
                 * findArrayVar - check if var have number at the end, such variables uses for define array
                 */
                const findArrayVar = new RegExp(`^${uploadVar}.\\d{1,2}$`);

                if (findArrayVar.test(envVar)) {
                    const index = envVar.match(FIND_VAR_INDEX)[0];

                    if (!resultVars[index]) {
                        resultVars[index] = {};
                    }

                    resultVars[index][envVar.replace(FIND_VAR_INDEX_WITH_DOT, '')] = process.env[envVar];
                }
            });
        });

        const compactResultVars = _.compact(resultVars);

        compactResultVars.forEach((env, index) => {
            /**
             * REPORT_WRAP_DIR - name of folder in which will be uploaded files
             * by existing this var reporter know that multireports uploads now
             */
            env.REPORT_WRAP_DIR = index;
        });

        return compactResultVars.length ? compactResultVars : undefined;
    }
}

module.exports = ConfigUtils;
