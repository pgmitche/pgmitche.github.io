import { defineConfig } from "vite";
import { load } from "js-yaml";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
  },
  plugins: [
    {
      name: "yaml",
      transform(src, id) {
        if (/\.ya?ml$/.test(id)) {
          return {
            code: `export default ${JSON.stringify(load(src))}`,
            map: null,
          };
        }
      },
    },
  ],
});
