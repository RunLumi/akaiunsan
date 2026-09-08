module.exports = {
  // CI runners are slower than dev machines; deep-render characterization tests exceed 5s
  testTimeout: 30000,

  preset: "jest-expo",
  setupFiles: [
    "<rootDir>/jest.preload.js",
    require.resolve("jest-expo/src/preset/setup.js"),
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // Keep the transform cache on the project disk (the boot volume is ~99% full).
  cacheDirectory: "<rootDir>/.jest-cache",
  // @reduxjs/toolkit pulls immer's ESM legacy build; map to the CJS bundle
  // the Node test environment can parse (Phase 5 RTK Query strangler).
  moduleNameMapper: {
    "^immer$": "<rootDir>/node_modules/immer/dist/cjs/immer.cjs.production.js",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/assets/**",
  ],
  coveragePathIgnorePatterns: [
    "node_modules",
    "<rootDir>/src/(assets|types|constants)/",
    "<rootDir>/src/.*/__tests__/",
    "<rootDir>/src/test-utils/",
  ],
};
