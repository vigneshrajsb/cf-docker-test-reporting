const exec = require('util').promisify(require('child_process').exec);

class EnvExporter {

    async export({ key,  value, config }) {
        const { stderr } = await exec(`echo ${key}=${value} >> ${config.env.volumePath}/env_vars_to_export`);
        if (stderr) {
            throw new Error(`Error occurred while executing cf-export: ${stderr}`);
        } else {
            return `${key}="${value}" successfully exported!`;
        }
    }
}

module.exports = new EnvExporter();
