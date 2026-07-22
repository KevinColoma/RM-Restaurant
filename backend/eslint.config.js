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
    ignores: ['public/**', 'tests/formUtils.test.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    // Runs under @jest-environment jsdom (see the docblock in the file) to
    // exercise the real DOM API in public/assets/js/form-utils.js, so it
    // needs `document` etc. on top of the usual node/jest globals.
    files: ['tests/formUtils.test.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser,
      },
    },
  },
];
