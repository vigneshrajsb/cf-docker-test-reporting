const exec = require('util').promisify(require('child_process').exec);

class Exporter {

    async export({ key,  value }) {
        const { stderr } = await exec(`echo ${key}=${value} >> /meta/env_vars_to_export`);
        if (stderr) {
            throw new Error(`Error occurred while executing cf-export: ${stderr}`);
        } else {
            return `${key}="${value}" successfully exported!`;
        }
    }
}

module.exports = new Exporter();
