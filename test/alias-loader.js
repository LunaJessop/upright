import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const filename =
      rel.endsWith(".js") || rel.endsWith(".jsx") ? rel : `${rel}.js`;
    return nextResolve(pathToFileURL(path.join(root, filename)).href, context);
  }
  return nextResolve(specifier, context);
}
