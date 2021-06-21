const v2 = require('./v2');
const v3 = require('./v3');

module.exports = class UrlFactory {

    constructor(config) {
        return this._resolveFactory(config);
    }

    _resolveFactory(config) {
        return config.env.reportPath ? v3 : v2;
    }
};
