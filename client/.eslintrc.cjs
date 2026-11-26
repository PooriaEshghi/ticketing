module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react'],
  extends: ['eslint:recommended', 'plugin:react/jsx-runtime'],
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['.next/', 'node_modules/', 'coverage/'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'react/jsx-uses-vars': 'error',
  },
};
