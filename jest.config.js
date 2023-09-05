/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */

const esModules = ['@microsoft/msfs-sdk'].join('|');
module.exports = {
    preset: 'ts-jest',

    testEnvironment: 'node',
    transform: {
        "\\.[j]s?$": "ts-jest",
    },

    transformIgnorePatterns: [`/node_modules/(?!${esModules})`],

    setupFilesAfterEnv: [
        "./fbw-common/src/jest/setupJestMock.js"
    ],
    globals: {
        'ts-jest': {
            // Babel assumes isolated modules, therefore enable it here as well.
            // This also speeds up the unit testing performance.
            isolatedModules: true,
            diagnostics: {
                ignoreCodes: ['TS151001'],
            },
            tsconfig: {
                "jsx": "react",
                "typeRoots": [
                    "<rootDir>/fbw-common/src/typings",
                    "<rootDir>/node_modules/@types"
                ],
                "moduleResolution": "node",
                "allowSyntheticDefaultImports": true,
                "allowJs": true,
                "esModuleInterop": true,
            },
        }
    },

    moduleNameMapper: {
        '@flybywiresim/fbw-sdk' : '<rootDir>/fbw-common/src/systems/index.ts',

        "@fmgc/types/fstypes/FSEnums": "<rootDir>/fbw-a32nx/src/systems/fmgc/src/types/fstypes/FSEnums.ts",
        "@shared/autopilot": ["<rootDir>/fbw-a32nx/src/systems/shared/src/autopilot.ts" ],
        "@shared/logic" :"<rootDir>/fbw-a32nx/src/systems/shared/src/logic.ts",
        "@shared/flightphase" :"<rootDir>/fbw-a32nx/src/systems/shared/src/flightphase.ts"

    }
};
