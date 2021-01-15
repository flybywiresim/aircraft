'use strict';

module.exports = {
    root: true,
    env: {
        browser: true,
    },
    extends: 'airbnb',
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'script',
        requireConfigFile: false,
        babelOptions: {
            presets: ['@babel/preset-react'],
        },
    },
    overrides: [
        {
            files: ['*.jsx'],
            parserOptions: {
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
        },
        {
            files: ['*.mjs'],
            parserOptions: {
                sourceType: 'module',
            },
        },
    ],
    // overrides airbnb, use sparingly
    rules: {
        'arrow-parens': ['error', 'always'],
        'brace-style': ['error', '1tbs', { allowSingleLine: false }],
        'class-methods-use-this': 'off',
        'curly': ['error', 'all'],
        'import/prefer-default-export': 'off',
        'import/no-extraneous-dependencies': ['error', {
            devDependencies: true,
        }],
        'indent': ['error', 4],
        'react/jsx-indent': ['error', 4],
        'no-restricted-syntax': 'off',
        'no-unused-vars': ['error', {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
        }],
        'quote-props': ['error', 'consistent-as-needed'],
        'strict': ['error', 'global'],

        // Not needed with react 17+
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',

        'camelcase': 'off',
        'max-len': ['error', 200], // Temporary until we can refactor the Core
        'no-console': 'off', // May need to disable this
        'no-underscore-dangle': 'off',
        'max-classes-per-file': 'off',
        'no-plusplus': 'off',
        'no-restricted-globals': 'off',
        'no-bitwise': 'off',
        'no-restricted-properties': 'off',
        'no-floating-decimal': 'off',
        'no-mixed-operators': 'off',
        'no-shadow': 'off',
        'no-param-reassign': 'off',
        'default-case': 'off',
        'no-undef': 'warn',
        'no-continue': 'off',
        'no-await-in-loop': 'off',
        'no-throw-literal': 'off',
        'no-use-before-define': 'off',
        'eqeqeq': 'warn',
        'consistent-return': 'warn',
        'radix': 'off',
        'prefer-destructuring': 'warn',
        'no-empty': 'warn',
        'no-useless-constructor': 'warn',
        'no-fallthrough': 'warn',
        'block-scoped-var': 'warn',
        'react/prop-types': 'off',
        'vars-on-top': 'warn',
        'no-var': 'warn',
        'no-redeclare': 'warn',
        'prefer-rest-params': 'warn',
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                jsx: 'always',
            },
        ],
    },
    globals: {
        Simplane: 'readonly',
        SimVar: 'readonly',
        FlightPhase: 'readonly',
        Coherent: 'readonly',
        Avionics: 'readonly',
    },
};
