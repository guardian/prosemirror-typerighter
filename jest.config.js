module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageReporters: ["json", "html"],
  setupFiles: ['./.jest.setup.js'],
  globals: {
    "ts-jest": {
      isolatedModules: true
    }
  }
};
