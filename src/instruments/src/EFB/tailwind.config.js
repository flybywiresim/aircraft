'use strict';

const colors = require('tailwindcss/colors');

module.exports = {
    mode: 'jit',
    content: [
        './**/*.{jsx,tsx}',
    ],
    theme: {
        extend: {
            width: () => ({
                'inr-tk': '13.45rem',
                'out-tk': '5.25rem',
            }),
            height: () => ({
                'content-section-reduced': '54rem',
                'content-section-full': '57.25rem',
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
                colors,
                'theme-highlight': 'var(--color-highlight)',
                'theme-body': 'var(--color-body)',
                'theme-text': 'var(--color-text)',
                'theme-unselected': 'var(--color-unselected)',
                'theme-secondary': 'var(--color-secondary)',
                'theme-statusbar': 'var(--color-statusbar)',
                'theme-accent': 'var(--color-accent)',
                'cyan': {
                    DEFAULT: '#00E0FE',
                    medium: '#00C4F5',
                },
                'utility': {
                    'red': '#dc2626',
                    'green': '#84cc16',
                    'orange': '#ff6a00',
                    'amber': '#f59e0b',
                    'blue': '#5280ea',
                    'purple': '#993df5',
                    'pink': '#e92f8b',
                    'salmon': '#f87171',
                    'grey': '#d0d0d0',
                    'dark-grey': '#696969',
                },
            },
            maxWidth: { '1/2': '50%' },
        },
        fontFamily: {
            mono: ['JetBrains Mono'],
            body: ['Inter'],
            title: ['Manrope'],
            rmp: ['AirbusRMP'],
        },
    },
    // eslint-disable-next-line global-require
    plugins: [require('@flybywiresim/tailwind-config')],
};
