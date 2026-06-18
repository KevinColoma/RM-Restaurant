import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'coverage/',
      'node_modules/',
      'dist/',
    ],
  },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.vitest,
        $: 'readonly',
        jQuery: 'readonly',
        Swal: 'readonly',
        ApexCharts: 'readonly',
        feather: 'readonly',
        applyTranslations: 'readonly',
        setLanguage: 'readonly',
        ClipboardJS: 'readonly',
        moment: 'readonly',
        bootstrap: 'readonly',
        FileUploadWithPreview: 'readonly',
      },
    },
  },
];
