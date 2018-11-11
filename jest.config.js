module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageReporters: ["json", "html"],
  globals: {
    "ts-jest": {
      isolatedModules: true
    }
  }
};
