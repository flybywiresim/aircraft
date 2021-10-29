'use strict';

const reactComponentsClasses = require('../../../../node_modules/@flybywiresim/react-components/build/usedCSSClasses.json');

module.exports = {
    purge: {
        content: [
            './**/*.{jsx,tsx}',
        ],
        safelist: [
            ...reactComponentsClasses,
        ],
    },
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            width: () => ({
                'inr-tk': '13.45rem',
                'out-tk': '5.25rem',
            }),
            height: () => ({
                'efb': '54rem',
                'efb-nav': '45.75rem',
                '124': '34.75rem',
            }),
            inset: () => ({
                'ctr-tk-y': '18.75rem',
                'inn-tk-y': '14.5rem',
                'inn-tk-l': '31.5rem',
                'inn-tk-r': '24.75rem',
                'out-tk-y': '12.75rem',
                'out-tk-l': '26.25rem',
                'out-tk-r': '19.5rem',
                'overlay-b-y': '10.25rem',
                'overlay-bl': '22.5rem',
                'overlay-br': '15.5rem',
                'overlay-t-y': '18rem',
                'overlay-tl': '21rem',
                'overlay-tr': '14rem',
            }),
            rotate: () => ({
                '18.5': '18.5deg',
                '-18.5': '-18.5deg',
                '26.5': '26.5deg',
                '-26.5': '-26.5deg',
            }),
            colors: {
                'theme-highlight': 'var(--color-highlight)',
                'theme-body': 'var(--color-body)',
                'theme-text': 'var(--color-text)',
                'theme-unselected': 'var(--color-unselected)',
                'theme-secondary': 'var(--color-secondary)',
                'theme-statusbar': 'var(--color-statusbar)',
            }
        },
        fontFamily: {
            mono: ['JetBrains Mono'],
            body: ['Inter'],
            title: ['Manrope'],
        },
        boxShadow: {
            lg: '0px 0px 4px 2px rgba(0, 0, 0, 0.5)'
        }
    },
    variants: { extend: {} },
    // eslint-disable-next-line global-require
    plugins: [require('@flybywiresim/tailwind-config')],
};
