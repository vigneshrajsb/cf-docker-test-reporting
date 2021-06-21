const builderV2 = require('./v2');
const builderV3 = require('./v3');

module.exports = class UrlFactory {

    constructor(config) {
        return this._resolveBuilder(config);
    }

    _resolveBuilder(config) {
        return config.env.reportPath ? builderV3 : builderV2;
    }
};
