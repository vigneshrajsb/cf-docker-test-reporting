const rp = require('request-promise');

class CodefreshAPI {
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

    static async getProcessById({ id, config }) {
        const opts = {
            uri: `${config.apiHost}/api/workflow/${id}/process`,
            headers: {
                'Authorization': config.env.apiKey
            }
        };

        let process;

        try {
            const processRes = await rp(opts);
            process = JSON.parse(processRes);
        } catch (e) {
            throw new Error('Error during getting process info');
        }

        if (!process) {
            throw new Error('Error, process info is not defined');
        }

        return process;
    }
}

module.exports = CodefreshAPI;
