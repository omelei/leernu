import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // The design contract, enforced rather than remembered. A literal colour in a
  // component is invisible in review and breaks the palette in one place only,
  // which is the worst way for it to break.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message:
            'Colours come from CSS variables via Tailwind tokens, never a literal hex. See tailwind.config.ts.',
        },
      ],
    },
  },

  // game-core must stay importable by a server that has no DOM (ADR-015). This
  // is the rule that keeps server-side score validation affordable later; once
  // a browser import creeps in, the module stops being portable and nobody
  // notices until the day it matters.
  {
    files: ['src/game-core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'zustand', 'idb', 'framer-motion', '@/store/*', '@/features/*'],
              message: 'game-core must stay pure: no browser or framework imports. See ADR-015.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'sessionStorage',
        'indexedDB',
        'navigator',
      ],
    },
  },
);
