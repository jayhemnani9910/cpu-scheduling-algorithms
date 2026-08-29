// Flat config for ESLint 9. The rules mirror the legacy .eslintrc.json this replaces.
"use strict";

module.exports = [
    {
        files: ["**/*.js"],
        ignores: ["node_modules/**"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "off",
            semi: ["error", "always"],
            "no-console": "off",
        },
    },
];
