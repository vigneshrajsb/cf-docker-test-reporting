'use strict';

const rp = require('request-promise');

class AnnotationLogic {
    static async createAnnotation({ config, value }) {
        // this query use proxy ability to replace :account_id to currentAccountID
        // this ability use because we don`t know accountId
        const createAnnotationOpts = {
            uri: `${config.apiHost}/api/annotations`,
            headers: {
                'Authorization': config.env.apiKey
            },
            method: 'post',
            body: {
                entityId: config.env.buildId,
                entityType: 'build',
                key: config.annotationName,
                value,
            },
            json: true,
        };

        return rp(createAnnotationOpts);
    }
}

module.exports = AnnotationLogic;
