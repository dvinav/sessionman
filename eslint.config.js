import eslint from '@eslint/js'
import tslint from 'typescript-eslint'
import security from 'eslint-plugin-security'

export default tslint.config(security.configs.recommended, eslint.configs.recommended, tslint.configs.recommended, {
  rules: {
    eqeqeq: 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
})
