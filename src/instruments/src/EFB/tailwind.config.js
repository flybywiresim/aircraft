'use strict';

module.exports = {
    darkMode: false, // or 'media' or 'class'
    theme: { extend: { height: () => ({ efb: '50rem' }) } },
    variants: { extend: {} },
    // eslint-disable-next-line global-require
    plugins: [require('@flybywiresim/tailwind-config')],
};
