import { defineConfig } from "vitest/config"

/**
 * Separate from vite.config.ts on purpose.
 *
 * The app config loads the Cloudflare plugin, which boots a workerd runtime.
 * These tests cover pure logic — money arithmetic and payment matching — and
 * need no runtime at all, so pulling one in would only make them slower and
 * more fragile.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
})
