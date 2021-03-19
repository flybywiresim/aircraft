// eslint-disable-next-line strict
import generated from '@flybywiresim/tailwind-config';

module.exports = {
    darkMode: false, // or 'media' or 'class'
    theme: { extend: { height: () => ({ efb: '50rem' }) } },
    variants: { extend: {} },
    plugins: [generated],
};
