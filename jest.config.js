/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: [
        "./jest/setupJestMock.js"
    ],
    globals: {
        'ts-jest': {
            diagnostics: {
                ignoreCodes: ['TS151001'],
            }
        }
    }
};
