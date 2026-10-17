// Controllo del codice: le regole consigliate di ESLint, con le variabili globali del browser
// (src/) e di Node (strumenti e configurazioni).
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['tools/**/*.{js,mjs,cjs}', '*.config.js'], languageOptions: { globals: globals.node } },
  // le prove girano in Node ma passano funzioni da eseguire nella pagina
  { files: ['test/**/*.mjs'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] } },
];
