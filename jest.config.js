/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: [
        "./jest/setupJestMock.js"
    ],
    globals: {
        'ts-jest': {
            // Babel assumes isolated modules, therefore enable it here as well.
            // This also speeds up the unit testing performance.
            isolatedModules: true,
            diagnostics: {
                ignoreCodes: ['TS151001'],
            }
        }
    }
};
