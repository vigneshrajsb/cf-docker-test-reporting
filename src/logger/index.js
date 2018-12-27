'use strict';

/* eslint prefer-rest-params: 0 */

const colors = {
    aqua: '\x1b[36m',
    none: '\x1b[0m'
};

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
