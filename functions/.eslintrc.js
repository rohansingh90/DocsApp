/* eslint-disable no-undef */
module.exports = {
  env: {
    es6: true,
    node: true,
    commonjs: true,
    es2020: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
    {
      files: [".eslintrc.js"],
      rules: {
        "no-undef": "off",
      },
    },
    {
      files: ["index.js"],
      rules: {
        "no-undef": "off",
      },
    },
  ],
  globals: {
    "module": "readonly",
    "Buffer": "readonly",
    "exports": "readonly",
  },
};
