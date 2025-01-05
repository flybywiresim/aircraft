/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./fbw-common/src/jest/setupJestMock.js'],
  transform: {
    '.spec.ts$': [
      'ts-jest',
      {
        // Babel assumes isolated modules, therefore enable it here as well.
        // This also speeds up the unit testing performance.
        isolatedModules: true,
        diagnostics: {
          ignoreCodes: ['TS151001'],
        },
      },
    ],
  },
  // disable fmsv2 tests until they are fixed
  modulePathIgnorePatterns: [
    'fbw-a32nx/src/systems/fmgc/src/flightplanning',
    'fbw-a380x/src/systems/fmgc/src/flightplanning',
  ],
  moduleNameMapper: {
    '@flybywiresim/fbw-sdk': '<rootDir>/fbw-common/src/systems/index.ts',
  },
};
