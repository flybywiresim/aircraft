/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
    },
    globals: {
        Simplane: 'readonly',
        SimVar: 'readonly',
        Utils: 'readonly',
        JSX: 'readonly',
    },
};
