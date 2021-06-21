const builderV2 = require('./builderV2');
const builderV3 = require('./builderV3');

module.exports = class UrlBuilderFabric {

    constructor(config) {
        return this._resolveBuilder(config);
    }

    _resolveBuilder(config) {
        return config.env.reportPath ? builderV3 : builderV2;
    }
};
