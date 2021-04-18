'use strict';

module.exports = {
    purge: {
        enabled: true,
        content: [
            './**/*.{jsx,tsx}',
        ],
    },
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            height: () => ({
                120: '30rem',
                144: '36rem',
                160: '40rem',
                map: '40.3rem',
            }),
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-1deg)' },
                    '50%': { transform: 'rotate(2.5deg)' },
                },
            },
            animation: { wiggle: 'wiggle 15s ease-in-out infinite' },
            backgroundColor: ['active'],
            textColor: ['active'],
            colors: {
                blue: {
                    'DEFAULT': '#6399AE',
                    'light': '#00C2CB',
                    'light-contrast': '#009da6',
                    'medium': '#006166',
                    'medium-contrast': '#1f2937',
                    'darkish': '#1a2742',
                    'dark': '#1b2434',
                    'darker': '#182130',
                    'darkest': '#0b101a',
                },
                gray: { medium: '#797979' },
            },
            boxShadow: {
                'md-dark': '1px 1px 7px 1px rgba(0, 0, 0, 0.2)',
                'md-dark-contrast': '1px 1px 7px 1px rgba(0, 0, 0, 0.35)',
                'lg-dark': '1px 1px 10px 1px rgba(0, 0, 0, 0.15)',
                '2xl-light': '0 0 50px -20px rgba(255, 255, 255, 0.15)',
            },
        },
    },
    variants: {
        extend: {
            display: ['last'],
            margin: ['first', 'last'],
            padding: ['first', 'last'],
        },
    },
    plugins: [],
};
