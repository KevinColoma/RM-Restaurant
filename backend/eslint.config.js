const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'public/assets/plugins/**',
      '**/*.min.js',
      'coverage/',
      'node_modules/',
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
      sourceType: 'script',
    },
  },
  {
    files: ['public/assets/js/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery,
        feather: 'readonly',
        Swal: 'readonly',
        bootstrap: 'readonly',
        FileUploadWithPreview: 'readonly',
        ClipboardJS: 'readonly',
        moment: 'readonly',
      },
    },
  },
  {
    files: ['**/*.js'],
    ignores: ['public/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
];
