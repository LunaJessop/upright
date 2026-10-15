import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../node_modules/next/package.json", import.meta.url));
const { transformSync } = require("next/dist/build/swc/index.js");

/** Let node:test import the few JSX components that need a render check. */
export async function load(url, context, nextLoad) {
  if (!url.endsWith(".jsx")) return nextLoad(url, context);

  const source = readFileSync(fileURLToPath(url), "utf8");
  const { code } = transformSync(source, {
    filename: url,
    jsc: {
      parser: { syntax: "ecmascript", jsx: true },
      target: "es2022",
      transform: { react: { runtime: "automatic" } },
    },
    module: { type: "es6" },
  });

  return { format: "module", source: code, shortCircuit: true };
}
