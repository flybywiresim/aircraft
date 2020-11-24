'use strict';

const { Parser } = require('./parser');
const { Assembler } = require('./assembler');

function translate(source, specifier) {
    const ast = Parser.parse(source, specifier);
    const out = Assembler.assemble(ast, source, specifier);
    return out;
}

module.exports = {
    translate,
};

if (require.main === module) {
    /* eslint-disable global-require */
    const util = require('util');
    const repl = require('repl');

    repl.start({
        prompt: '> ',
        eval(source, c, f, cb) {
            try {
                cb(null, translate(source, '(repl)'));
            } catch (e) {
                cb(e, null);
            }
        },
        writer: (v) => (typeof v === 'string' ? v : util.inspect(v)),
    });
}
