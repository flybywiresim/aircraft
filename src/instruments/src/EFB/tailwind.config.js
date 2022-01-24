'use strict';

const reactComponentsClasses = require('@flybywiresim/react-components/build/usedCSSClasses.json');

const watchFolders = [
    'ATC',
    'ChartsApi',
    'Dashboard',
    'Dispatch',
    'Enum',
    'Failures',
    'Ground',
    'Navigation',
    'Performance',
    'Service',
    'Settings',
    'SimbriefApi',
    'StatusBar',
    'Store',
    'TODCalculator',
    'ToolBar',
    'UtilComponents',
    'Utils',
];

module.exports = {
    purge: {
        enabled: false,
        content: [
        // './Efb.tsx',
        // './index.tsx',
        // './failures-orchestrator-provider.tsx',
        // './node_modules/@flybywiresim/react-components/build/usedCSSClasses.json',
        // ...watchFolders.map((folder) => `./EFB/${folder}/**/*.tsx`),
        ],
        safelist: [...reactComponentsClasses],
    },
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
                'theme-accent': 'var(--color-accent)',
            },
            maxWidth: { '1/2': '50%' },
        },
        fontFamily: {
            mono: ['JetBrains Mono'],
            body: ['Inter'],
            title: ['Manrope'],
            rmp: ['AirbusRMP'],
        },
        boxShadow: { lg: '0px 0px 4px 2px rgba(0, 0, 0, 0.5)' },
    },
    // eslint-disable-next-line global-require
    plugins: [require('@flybywiresim/tailwind-config')],
};
