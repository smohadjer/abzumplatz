import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs['recommended-latest'].rules,
      // TypeScript already reports undefined names and unreachable code more
      // accurately than ESLint's JavaScript-only rules.
      'no-undef': 'off',
      'no-unreachable': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': ['warn', {allowConstantExport: true}],
    },
  },
  {
    files: ['src/pages/Reservations.tsx', 'src/utils/utils.ts'],
    rules: {
      // These legacy modules expose selector-backed helpers that predate the
      // custom-hook naming convention and will be migrated separately.
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
