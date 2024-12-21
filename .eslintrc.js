// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

'use strict';

const path = require('path');
module.exports = {
  env: { browser: true },
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    // 'plugin:@typescript-eslint/recommended', -- Disabled as it is complex to fix, needs to be done bit by bit
    'plugin:@typescript-eslint/eslint-recommended',
    // 'plugin:react-hooks/recommended', -- Disabled as it is complex to fix, needs to be done bit by bit, and we are moving away from react
    // 'plugin:react/recommended', -- Disabled as it is complex to fix, needs to be done bit by bit, and we are moving away from react
  ],
  plugins: ['@typescript-eslint', 'prettier', 'react-hooks', 'react', 'tailwindcss'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script',
    requireConfigFile: false,
  },
  overrides: [
    {
      files: [
        '.eslintrc.js',
        'scripts/**/*.js',
        '**/mach.config.js',
        '**/rollup.config.js',
        '**/tailwind.config.js',
        '**/jest.config.js',
      ],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['fbw-common/src/jest/**/*.js'],
      env: {
        node: true,
      },
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
    },
  ],
  settings: {
    tailwindcss: {
      groupByResponsive: true,
      config: path.join(__dirname, 'fbw-common', 'src', 'systems', 'instruments', 'src', 'EFB', 'tailwind.config.js'),
    },
    react: { version: 'detect' },
  },
  ignorePatterns: ['fbw-common/src/typings/*', 'fbw-ingamepanels-checklist-fix/*'],
  rules: {
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: 'FSComponent|_.*',
        argsIgnorePattern: '_.*',
      },
    ],

    'tailwindcss/classnames-order': 'error',
    'tailwindcss/enforces-negative-arbitrary-values': 'error',
    'tailwindcss/enforces-shorthand': 'off',
    'tailwindcss/migration-from-tailwind-2': 'error',
    'tailwindcss/no-contradicting-classname': 'error',
  },
  globals: {
    Simplane: 'readonly',
    SimVar: 'readonly',
    Utils: 'readonly',
    JSX: 'readonly',
    Coherent: 'readonly',
    ViewListener: 'readonly',
    RegisterViewListener: 'readonly',
  },
};
