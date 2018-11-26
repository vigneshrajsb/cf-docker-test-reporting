'use strict';

const chai = require('chai');
const PaymentsLogic = require('./index');
const config = require('../../config');

const expect = chai.expect;

describe.only('PaymentsLogic', () => {
    it('Should set max upload size', async () => {
        config.uploadMaxSize = 0;
        await PaymentsLogic.setMaxUploadSizeDependingOnPlan();

        expect(config.uploadMaxSize > 0).to.equal(true);
    });
});
