import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function withExtension(rel) {
  if (rel.endsWith(".js") || rel.endsWith(".jsx") || rel.endsWith(".json")) {
    return rel;
  }
  if (existsSync(path.join(root, `${rel}.js`))) return `${rel}.js`;
  if (existsSync(path.join(root, `${rel}.jsx`))) return `${rel}.jsx`;
  return `${rel}.js`;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const filename = withExtension(specifier.slice(2));
    return nextResolve(pathToFileURL(path.join(root, filename)).href, context);
  }
  return nextResolve(specifier, context);
}
