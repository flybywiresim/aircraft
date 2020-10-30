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
    },
    globals: {
        Simplane: 'readonly',
    },
};
