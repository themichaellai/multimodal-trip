import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { fixupPluginRules } from '@eslint/compat';
import pluginReactHooks from 'eslint-plugin-react-hooks';

export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    plugins: {
      'react-hooks': fixupPluginRules(pluginReactHooks),
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    rules: {
      'react/prop-types': 'off',
      'react/display-name': 'off',
    },
  },
  {
    ignores: ['convex/**/*', '.next/**/*'],
  },
];
