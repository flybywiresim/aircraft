// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import replaceCodePlugin from 'vite-plugin-filter-replace';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import dotenv from 'dotenv';

dotenv.config({ path: '../../../../../../.env' });

const envVarsToReplace = ['CLIENT_ID', 'CLIENT_SECRET', 'SENTRY_DSN', 'AIRCRAFT_PROJECT_PREFIX', 'AIRCRAFT_VARIANT'];

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss({ config: 'tailwind.config.js' }), autoprefixer()],
    },
  },
  plugins: [
    react({ jsxRuntime: 'classic' }),
    tsconfigPaths({ root: '../../../' }),
    replaceCodePlugin([
      {
        filter: /\.tsx?$/,
        replace: {
          from: 'process.env.VITE_BUILD',
          to: 'true',
        },
      },
      ...envVarsToReplace.map((it) => {
        const value = process.env[it];

        if (!value) {
          throw new Error(`Not env value for ${it}.`);
        }

        return {
          filter: /\.tsx?$/,
          replace: {
            from: `process.env.${it}`,
            to: `'${value}'`,
          },
        };
      }),
    ]),
  ],
});
