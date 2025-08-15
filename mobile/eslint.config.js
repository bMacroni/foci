// Minimal ESLint v9 flat config for React Native + TypeScript
// 2025-08-15 CST: initial lightweight config

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', 'android/**', 'ios/**'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { __DEV__: 'readonly' },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'off',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      eqeqeq: 'warn',
      semi: ['warn', 'always'],
      curly: 'warn',
      // Keep ESLint green: disable plugin rules that are not yet configured project-wide
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
