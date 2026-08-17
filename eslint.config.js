import js from '@eslint/js';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  HTMLElement: 'readonly',
  customElements: 'readonly',
  navigator: 'readonly',
  URL: 'readonly',
  MediaMetadata: 'readonly',
  console: 'readonly',
  localStorage: 'readonly',
  matchMedia: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly'
};

export default [
  { ignores: ['dist/**', 'js/**', 'css/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: browserGlobals }
  },
  {
    files: ['**/*.test.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly', test: 'readonly', expect: 'readonly', describe: 'readonly', beforeEach: 'readonly', afterEach: 'readonly', Storage: 'readonly', ...browserGlobals }
    }
  }
];
