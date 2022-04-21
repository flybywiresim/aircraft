import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { replaceCodePlugin } from 'vite-plugin-replace';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import dotenv from 'dotenv';

dotenv.config({ path: '../../../../.env' });

const envVarsToReplace = ['CLIENT_ID', 'CLIENT_SECRET', 'SENTRY_DSN'];

export default defineConfig({
    css: {
        postcss: {
            plugins: [
                tailwindcss({ config: 'tailwind.config.js' }),
                autoprefixer(),
            ],
        },
    },
    plugins: [
        react(),
        tsconfigPaths({ root: '../../../' }),
        replaceCodePlugin({
            replacements: [
                {
                    from: 'process.env.VITE_BUILD',
                    to: 'true',
                },
                ...envVarsToReplace.map((it) => {
                    const value = process.env[it];

                    if (!value) {
                        throw new Error(`Not env value for ${it}.`);
                    }

                    return ({
                        from: `process.env.${it}`,
                        to: `'${value}'`,
                    });
                }),
            ],
        }),
    ],
});
