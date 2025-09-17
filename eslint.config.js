import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import jest from 'eslint-plugin-jest';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    ignores: ['src/**/*.js'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        performance: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'prettier/prettier': 'error',
      
      // Disable base rules that are covered by TypeScript
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_' 
      }],
      
      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      
      // General code quality
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Best practices
      'eqeqeq': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error'
    }
  },
  {
    files: ['tests/**/*.{js,ts}', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        ...jest.environments.globals.globals
      }
    },
    plugins: {
      jest,
      '@typescript-eslint': tseslint
    },
    rules: {
      ...jest.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'jest/expect-expect': 'error',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  prettier
];