module.exports = {
  preset: "jest-expo",
  setupFiles: [
    "<rootDir>/jest.preload.js",
    require.resolve("jest-expo/src/preset/setup.js"),
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // Keep the transform cache on the project disk (the boot volume is ~99% full).
  cacheDirectory: "<rootDir>/.jest-cache",
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
