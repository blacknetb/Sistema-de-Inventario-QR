/**
 * eslint.config.js - Configuración de ESLint para Inventory QR System
 * Utiliza el nuevo formato flat config de ESLint 9+
 */

import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
    // Ignorar archivos y directorios
    {
        ignores: [
            'dist/**',
            'build/**',
            'node_modules/**',
            'coverage/**',
            '*.config.js',
            '*.config.ts',
            'vite.config.js',
            'vite.config.ts',
            'public/**',
            '**/*.min.js',
            '**/vendor/**'
        ]
    },
    
    // Configuración base de ESLint
    js.configs.recommended,
    
    // Configuración para React
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'jsx-a11y': jsxA11y,
            import: importPlugin,
            prettier
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                },
                ecmaVersion: 2022,
                sourceType: 'module'
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node,
                ...globals.jest
            }
        },
        settings: {
            react: {
                version: 'detect'
            },
            'import/resolver': {
                node: {
                    extensions: ['.js', '.jsx', '.ts', '.tsx']
                }
            }
        },
        rules: {
            // Reglas de React
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'warn',
            'react/jsx-uses-react': 'off',
            'react/jsx-uses-vars': 'error',
            'react/jsx-no-duplicate-props': 'error',
            'react/jsx-no-undef': 'error',
            'react/jsx-pascal-case': 'error',
            'react/jsx-key': ['error', { checkFragmentShorthand: true }],
            'react/no-array-index-key': 'warn',
            'react/no-children-prop': 'error',
            'react/no-danger': 'warn',
            'react/no-deprecated': 'error',
            'react/no-direct-mutation-state': 'error',
            'react/no-find-dom-node': 'error',
            'react/no-is-mounted': 'error',
            'react/no-render-return-value': 'error',
            'react/no-string-refs': 'error',
            'react/no-this-in-sfc': 'error',
            'react/no-unescaped-entities': 'error',
            'react/no-unknown-property': 'error',
            'react/self-closing-comp': 'warn',
            
            // Reglas de React Hooks
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            
            // Reglas de React Refresh
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true }
            ],
            
            // Reglas de accesibilidad (jsx-a11y)
            'jsx-a11y/alt-text': 'error',
            'jsx-a11y/anchor-has-content': 'error',
            'jsx-a11y/aria-props': 'error',
            'jsx-a11y/aria-proptypes': 'error',
            'jsx-a11y/aria-role': 'error',
            'jsx-a11y/aria-unsupported-elements': 'error',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/heading-has-content': 'error',
            'jsx-a11y/html-has-lang': 'error',
            'jsx-a11y/iframe-has-title': 'error',
            'jsx-a11y/img-redundant-alt': 'error',
            'jsx-a11y/interactive-supports-focus': 'warn',
            'jsx-a11y/label-has-associated-control': 'error',
            'jsx-a11y/lang': 'error',
            'jsx-a11y/media-has-caption': 'warn',
            'jsx-a11y/mouse-events-have-key-events': 'warn',
            'jsx-a11y/no-access-key': 'error',
            'jsx-a11y/no-autofocus': 'warn',
            'jsx-a11y/no-distracting-elements': 'error',
            'jsx-a11y/no-interactive-element-to-noninteractive-role': 'warn',
            'jsx-a11y/no-noninteractive-element-interactions': 'warn',
            'jsx-a11y/no-noninteractive-element-to-interactive-role': 'warn',
            'jsx-a11y/no-redundant-roles': 'error',
            'jsx-a11y/no-static-element-interactions': 'warn',
            'jsx-a11y/role-has-required-aria-props': 'error',
            'jsx-a11y/role-supports-aria-props': 'error',
            'jsx-a11y/scope': 'error',
            'jsx-a11y/tabindex-no-positive': 'warn',
            
            // Reglas de importaciones
            'import/no-unresolved': 'error',
            'import/named': 'error',
            'import/default': 'error',
            'import/namespace': 'error',
            'import/no-absolute-path': 'error',
            'import/no-dynamic-require': 'error',
            'import/no-webpack-loader-syntax': 'error',
            'import/no-self-import': 'error',
            'import/no-cycle': ['error', { maxDepth: 10 }],
            'import/no-useless-path-segments': 'error',
            'import/export': 'error',
            'import/no-deprecated': 'warn',
            'import/no-extraneous-dependencies': ['error', {
                devDependencies: [
                    '**/*.test.js',
                    '**/*.test.jsx',
                    '**/*.spec.js',
                    '**/*.spec.jsx',
                    '**/vite.config.js',
                    '**/vitest.config.js',
                    '**/jest.config.js'
                ]
            }],
            'import/no-mutable-exports': 'error',
            'import/first': 'error',
            'import/exports-last': 'off',
            'import/no-duplicates': 'error',
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                        'object',
                        'type'
                    ],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true
                    }
                }
            ],
            'import/newline-after-import': 'error',
            'import/no-named-default': 'error',
            'import/no-named-export': 'off',
            'import/no-default-export': 'off',
            
            // Reglas generales de JavaScript
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-debugger': 'warn',
            'no-alert': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'eqeqeq': ['error', 'always', { null: 'ignore' }],
            'curly': ['error', 'all'],
            'no-unused-vars': ['warn', { 
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                ignoreRestSiblings: true 
            }],
            'no-undef': 'error',
            'no-duplicate-imports': 'error',
            'no-useless-constructor': 'error',
            'no-useless-escape': 'warn',
            'no-useless-return': 'warn',
            'no-useless-rename': 'error',
            'no-param-reassign': ['error', { props: false }],
            'no-shadow': 'error',
            'no-nested-ternary': 'warn',
            'no-unneeded-ternary': 'error',
            'no-mixed-operators': 'warn',
            'no-else-return': 'warn',
            'no-lonely-if': 'error',
            'no-multi-spaces': 'error',
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
            'no-trailing-spaces': 'error',
            'no-whitespace-before-property': 'error',
            'arrow-body-style': ['error', 'as-needed'],
            'arrow-parens': ['error', 'always'],
            'arrow-spacing': 'error',
            'block-spacing': 'error',
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            'comma-dangle': ['error', 'never'],
            'comma-spacing': ['error', { before: false, after: true }],
            'comma-style': ['error', 'last'],
            'computed-property-spacing': ['error', 'never'],
            'dot-location': ['error', 'property'],
            'eol-last': ['error', 'always'],
            'func-call-spacing': ['error', 'never'],
            'function-paren-newline': ['error', 'consistent'],
            'indent': ['error', 4, { 
                SwitchCase: 1,
                flatTernaryExpressions: true,
                ignoredNodes: ['TemplateLiteral']
            }],
            'key-spacing': ['error', { beforeColon: false, afterColon: true }],
            'keyword-spacing': ['error', { before: true, after: true }],
            'linebreak-style': ['error', 'unix'],
            'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
            'max-len': ['warn', { 
                code: 120, 
                ignoreUrls: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
                ignoreRegExpLiterals: true
            }],
            'new-cap': ['error', { newIsCap: true, capIsNew: false }],
            'new-parens': 'error',
            'newline-per-chained-call': ['error', { ignoreChainWithDepth: 3 }],
            'object-curly-newline': ['error', { 
                multiline: true,
                consistent: true
            }],
            'object-curly-spacing': ['error', 'always'],
            'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
            'operator-linebreak': ['error', 'before'],
            'padded-blocks': ['error', 'never'],
            'quote-props': ['error', 'as-needed'],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'semi-spacing': ['error', { before: false, after: true }],
            'space-before-blocks': 'error',
            'space-before-function-paren': ['error', {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }],
            'space-in-parens': ['error', 'never'],
            'space-infix-ops': 'error',
            'space-unary-ops': 'error',
            'spaced-comment': ['error', 'always', { markers: ['/'] }],
            'switch-colon-spacing': 'error',
            'template-curly-spacing': ['error', 'never'],
            'template-tag-spacing': ['error', 'never'],
            'unicode-bom': ['error', 'never'],
            'wrap-iife': ['error', 'inside'],
            
            // Reglas de Prettier (integración)
            'prettier/prettier': ['error', {
                singleQuote: true,
                trailingComma: 'none',
                tabWidth: 4,
                semi: true,
                printWidth: 100,
                bracketSpacing: true,
                arrowParens: 'always',
                endOfLine: 'lf'
            }]
        }
    },
    
    // Configuración específica para archivos de test
    {
        files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
        languageOptions: {
            globals: {
                ...globals.jest,
                ...globals.node
            }
        },
        rules: {
            'no-console': 'off',
            'import/no-extraneous-dependencies': 'off'
        }
    },
    
    // Configuración específica para archivos de configuración
    {
        files: ['*.config.js', 'vite.config.js', 'vitest.config.js', 'jest.config.js'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
            'import/no-extraneous-dependencies': 'off',
            'no-console': 'only',
        }
    }
];