const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/index.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.stories.tsx',
  ],
  coverageReporters: ['json-summary', 'text'],
  coverageThreshold: {
    global: {
      branches: 12,
      functions: 12.63,
      lines: 17,
      statements: 16.5,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/pages/'],
  globalSetup: '<rootDir>/global-setup.js',
};

const asyncConfig = createJestConfig(customJestConfig);

module.exports = async () => {
  const config = await asyncConfig();
  config.transformIgnorePatterns = [
    // this is one of wagmi's deps. It's a native ES module, and jest doesn't
    // currently support those. Adding it here transpiles it before running tests.
    'node_modules/@tanstack/query-sync-storage-persister',
  ];
  return config;
};
