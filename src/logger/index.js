'use strict';

/* eslint prefer-rest-params: 0 */

const { colors } = require('../../config');

class Logger {
    static log(color, ...msgs) {
        if (colors[color]) {
            console.log(colors[color], ...msgs, colors.none);
        } else {
            console.log(colors.aqua, ...arguments, colors.none);
        }
    }
}

module.exports = Logger;
