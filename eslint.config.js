//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    // Vendored shadcn/ui registry code. Kept byte-identical to the registry so
    // that `shadcn add --diff` stays usable, so its style is not our concern.
    // Our own code keeps these rules enforced.
    files: ["src/components/ui/**", "src/lib/utils.ts"],
    rules: {
      "import/consistent-type-specifier-style": "off",
      "no-shadow": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  {
    ignores: [
      "eslint.config.js",
      ".prettierrc",
      "worker-configuration.d.ts",
      "src/routeTree.gen.ts",
      ".wrangler/**",
    ],
  },
]
