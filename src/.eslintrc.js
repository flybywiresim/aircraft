'use strict';

module.exports = {
    root: true,
    env: { browser: true },
    extends: [
        '@flybywiresim/eslint-config',
        'plugin:jest/recommended',
        'plugin:jest/style',
    ],
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'script',
        requireConfigFile: false,
    },
    settings: { 'import/resolver': { node: { extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx'] } } },
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
        'no-bitwise': 'off',
        'no-mixed-operators': 'off',
        'arrow-parens': ['error', 'always'],
        'brace-style': ['error', '1tbs', { allowSingleLine: false }],
        'class-methods-use-this': 'off',
        'curly': ['error', 'multi-line'],
        'import/prefer-default-export': 'off',
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'indent': ['error', 4],
        'react/jsx-filename-extension': [2, { extensions: ['.jsx', '.tsx'] }],
        'react/jsx-indent': ['error', 4],
        'no-restricted-syntax': 'off',
        'quote-props': ['error', 'consistent-as-needed'],
        'strict': ['error', 'global'],

        'no-case-declarations': 'off',

        // just... why
        'no-plusplus': 'off',
        'no-shadow': 'off',
        'no-continue': 'off',

        'radix': 'off',

        // Avoid typescript-eslint conflicts
        'import/no-unresolved': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
        }],

        'no-use-before-define': 'off',

        'react/jsx-indent-props': 'off',

        // not relevant now
        'react/no-unused-state': 'off',

        // useless
        'react/prop-types': 'off',
        'react/require-default-props': 'off',
        'react/no-unused-prop-types': 'off',
        'react/destructuring-assignment': 'off',
        'react/jsx-props-no-spreading': 'off',
        'react/no-unescaped-entities': 'off',

        // Not needed with react 17+
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',

        'import/extensions': 'off',
        'no-param-reassign': 'off',
        'no-undef-init': 'off',
        'max-len': ['error', { code: 192 }],

        // Irrelevant for our use
        'jsx-a11y/alt-text': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'object-curly-newline': ['error', { multiline: true }],
        'linebreak-style': 'off',

        // allow typescript overloads
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': ['error'],
        'lines-between-class-members': 'off',
        '@typescript-eslint/lines-between-class-members': ['error'],
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': ['error'],
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
