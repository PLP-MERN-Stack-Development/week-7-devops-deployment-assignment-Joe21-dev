import js from '@eslint/js';

export default [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      ...js.rules,
      'no-unused-vars': ['warn', { args: 'none' }],
    },
  },
];
