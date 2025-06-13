import { defineConfig } from "eslint/config";
import globals from "globals";
// @ts-ignore
import html from "eslint-plugin-html";
import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";


export default defineConfig([
    {
        extends: [
            js.configs.all,
            sonarjs.configs.recommended,
            unicorn.configs.all,
        ],
        rules: {
            "func-style": ["error", "declaration"],
            "id-length": "off",
            "max-lines": "off",
            "max-lines-per-function": "off",
            "max-params": "off",
            "max-statements": "off",
            "no-console": "warn",
            "no-inline-comments": "off",
            "no-magic-numbers": ["error", {
                ignore: [-2.0, -1.0, 0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 360.0]
            }],
            "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
            "no-undefined": "off",
            "no-warning-comments": "warn",
            "one-var": ["error", "never"],
            "sonarjs/cognitive-complexity": "warn",
            "sonarjs/no-inverted-boolean-check": "off",
            "sonarjs/todo-tag": "warn",
            "unicorn/filename-case": ["error", {
                case: "pascalCase", ignore: ["eslint.config.mjs", "index.html"]
            }],
            "unicorn/no-keyword-prefix": ["error", { checkProperties: false }],
            "unicorn/no-null": "off",
            "unicorn/no-zero-fractions": "off",
            "unicorn/prefer-spread": "off",
            "unicorn/prevent-abbreviations": "off",
        },
    },
    { files: ["**/*.html"], plugins: { html } },
    { languageOptions: { globals: globals.browser } },
]);
