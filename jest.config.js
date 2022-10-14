module.exports = {
  preset: "ts-jest",
  coverageReporters: ["json", "html"],
  setupFiles: ["./.jest.setup.js"],
  moduleNameMapper: {
    // uuid resolves to an ES6 module, which Node does not yet support
    "^uuid$": require.resolve("uuid")
  }
};
