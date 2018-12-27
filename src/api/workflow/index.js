'use strict';

const rp = require('request-promise');

class Workflow {
    static async getProcessById({ id, config }) {
        const opts = {
            uri: `${config.apiHost}/api/workflow/${id}/process`,
            headers: {
                'x-access-token': config.env.apiKey
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

module.exports = Workflow;
