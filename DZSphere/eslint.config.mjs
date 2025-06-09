import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";


export default defineConfig([
    {
        extends: [js.configs.all], plugins: { js }, rules: {
            "func-style": ["error", "declaration"],
            "id-length": "off",
            "max-lines-per-function": "off",
            "max-params": "off",
            "max-statements": "off",
            "no-inline-comments": "off",
            "no-magic-numbers": ["error", {
                "ignore": [-2.0, 0, 0.5, 1, 2, 3, 4, 5, 6, 7, 360.0]
            }],
            "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
            "no-warning-comments": "off",
            "one-var": ["error", "never"],
        }
    },
    { languageOptions: { globals: globals.browser } },
]);
