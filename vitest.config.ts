import path from "node:path";
import { defineConfig } from "vitest/config";

// Los imports del repo usan baseUrl "." (lib/..., src/..., app/...); vitest
// no lee tsconfig paths, así que se declaran los alias equivalentes. Los
// tests de componentes declaran su entorno con `// @vitest-environment jsdom`.
export default defineConfig({
  resolve: {
    alias: {
      lib: path.resolve(__dirname, "lib"),
      src: path.resolve(__dirname, "src"),
      app: path.resolve(__dirname, "app"),
      components: path.resolve(__dirname, "components"),
    },
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "panel-olffy/**", ".next/**"],
  },
});
