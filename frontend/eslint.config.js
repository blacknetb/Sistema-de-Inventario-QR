import globals from 'globals';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    // Archivos a ignorar
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      '*.config.cjs',
      '*.config.mjs',
      'public/**',
      '*.log',
      '*.lock',
      '.env*',
      '.gitignore',
      '.eslintrc*'
    ]
  },
  
  // Configuración base de JavaScript
  js.configs.recommended,
  
  // Configuración para archivos JavaScript/JSX
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        React: 'readonly',
        process: 'readonly'
      }
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.json']
        }
      }
    },
    rules: {
      // ✅ REACT RULES
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      
      // ✅ REACT HOOKS RULES
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // ✅ REACT REFRESH (HMR)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      
      // ✅ IMPORT RULES
      'import/no-unresolved': 'error',
      'import/named': 'warn',
      'import/default': 'warn',
      'import/export': 'error',
      'import/no-duplicates': 'warn',
      
      // ✅ ERROR HANDLING
      'no-unused-vars': [
        'warn', 
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^React$|^_',
          caughtErrors: 'none'
        }
      ],
      
      // ✅ CODE QUALITY
      'no-console': process.env.NODE_ENV === 'production' ? ['warn', { allow: ['warn', 'error'] }] : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      
      // ✅ STYLING
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'comma-dangle': ['error', {
        arrays: 'only-multiline',
        objects: 'only-multiline',
        imports: 'only-multiline',
        exports: 'only-multiline',
        functions: 'only-multiline'
      }],
      
      // ✅ SPACING
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }],
      'keyword-spacing': ['error', {
        before: true,
        after: true
      }],
      
      // ✅ BEST PRACTICES
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'default-case': 'warn',
      'no-else-return': 'warn',
      'no-implicit-coercion': 'warn',
      
      // ✅ NAMING CONVENTIONS
      'camelcase': ['warn', { properties: 'never' }]
    }
  },
  
  // ✅ CONFIGURACIÓN ESPECÍFICA PARA COMPONENTES REACT
  {
    files: ['**/components/**/*.{js,jsx}'],
    rules: {
      'react/prop-types': 'error',
      'react/display-name': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-target-blank': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-comment-textnodes': 'warn'
    }
  },
  
  // ✅ CONFIGURACIÓN PARA HOOKS PERSONALIZADOS
  {
    files: ['**/hooks/**/*.{js,jsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error'
    }
  },
  
  // ✅ CONFIGURACIÓN PARA ARCHIVOS DE CONFIGURACIÓN
  {
    files: ['**/*.config.js', '**/*.setup.js', '**/scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-console': 'off',
      'import/no-unresolved': 'off'
    }
  },
  
  // ✅ CONFIGURACIÓN PARA TESTS
  {
    files: ['**/*.test.{js,jsx}', '**/__tests__/**/*.{js,jsx}', '**/__mocks__/**/*.{js,jsx}'],
    plugins: {
      jest: require('eslint-plugin-jest')
    },
    rules: {
      'no-console': 'off',
      'import/no-unresolved': 'off',
      'react/react-in-jsx-scope': 'off',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error'
    }
  }
];