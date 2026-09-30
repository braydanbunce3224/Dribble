import { statSync } from "node:fs";
import { dirname, extname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXTS = [".ts", ".tsx", ".mts", ".js", ".mjs", ".json"];

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function resolveToFile(abs) {
  const ext = extname(abs);
  if (ext) return isFile(abs) ? abs : null;
  for (const e of EXTS) {
    if (isFile(abs + e)) return abs + e;
  }
  if (isDir(abs)) {
    for (const e of EXTS) {
      const idx = join(abs, "index" + e);
      if (isFile(idx)) return idx;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (
    specifier.startsWith("node:") ||
    specifier.startsWith("data:") ||
    specifier.startsWith("http:") ||
    specifier.startsWith("https:")
  ) {
    return nextResolve(specifier, context);
  }
  const isRelative = specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("file:");
  const isAlias = specifier.startsWith("@/");
  if (!isRelative && !isAlias) return nextResolve(specifier, context);

  let abs;
  if (isAlias) abs = join("/workspace/src", specifier.slice(2));
  else if (specifier.startsWith("file:")) abs = fileURLToPath(specifier);
  else if (specifier.startsWith("/")) abs = specifier;
  else {
    const parent = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd() + "/x";
    abs = resolvePath(dirname(parent), specifier);
  }
  const found = resolveToFile(abs);
  if (!found) return nextResolve(specifier, context);
  const url = pathToFileURL(found).href;
  if (found.endsWith(".json")) {
    return { shortCircuit: true, url, format: "json" };
  }
  return nextResolve(url, context);
}
