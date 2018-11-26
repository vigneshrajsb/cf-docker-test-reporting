'use strict';

const chai = require('chai');
const Payments = require('./index');
const config = require('../../config');

const expect = chai.expect;

describe('Payments', () => {
    it('Should set max upload size', async () => {
        config.uploadMaxSize = 0;
        await Payments.setMaxUploadSizeDependingOnPlan();

        expect(config.uploadMaxSize > 0).to.equal(true);
    });
});
