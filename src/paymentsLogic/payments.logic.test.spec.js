'use strict';

const chai = require('chai');
const PaymentsLogic = require('./index');
const Config = require('../../config');

const expect = chai.expect;

describe('PaymentsLogic', () => {
    it('Should return max upload size', async () => {
        const result = await PaymentsLogic.getMaxUploadSizeDependingOnPlan({ config: Config.getConfig() });

        expect(result > 0).to.equal(true);
    });
});
