module.exports = {
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["@typescript-eslint", "node", "prettier", "react", "react-hooks"],
  env: {
    es6: true,
    node: true,
    jest: true,
    commonjs: true,
    browser: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2018,
    project: "./tsconfig.eslint.json",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: { react: { version: "detect" } },
  rules: {
    "no-unused-vars": "off",
    "no-empty": "warn",
    "no-var": "warn",
    eqeqeq: "warn",
    "prefer-arrow-callback": "warn",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "prettier/prettier": "warn",
    "react/prop-types": "off"
  },
};
