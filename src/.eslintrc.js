'use strict';

module.exports = {
    root: true,
    env: { browser: true },
    extends: '@flybywiresim/eslint-config',
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'script',
        requireConfigFile: false,
    },
    settings: { 'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } } },
    overrides: [
        {
            files: ['*.jsx', '*.tsx'],
            parserOptions: {
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
        },
        {
            files: ['*.mjs', '*.ts', '*.d.ts'],
            parserOptions: { sourceType: 'module' },
        },
    ],
    // overrides airbnb, use sparingly
    rules: {
        // Irrelevant for our use
        'jsx-a11y/alt-text': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'object-curly-newline': ['error', { multiline: true }],
        'linebreak-style': 'off',
    },
    globals: {
        Simplane: 'readonly',
        SimVar: 'readonly',
        Utils: 'readonly',
    },
};
