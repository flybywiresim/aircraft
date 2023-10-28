module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        '@flybywiresim/eslint-config',
    ],
    rules: {
        'no-undef': 'off',
        'import/no-unresolved': 'off',
        'no-bitwise': 'off',
        'no-await-in-loop': 'off',
        'prefer-destructuring': 'off',
        'no-mixed-operators': ['error', {
            groups: [
                // ['+', '-', '*', '/', '%', '**'],
                ['&', '|', '^', '~', '<<', '>>', '>>>'],
                ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
                ['&&', '||'],
                ['in', 'instanceof'],
            ],
            allowSamePrecedence: false,
        }],
    },
};
