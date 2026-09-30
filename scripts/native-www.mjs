#!/usr/bin/env node
import { copyFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const client = join(process.cwd(), "native/www/client");
const shell = join(client, "_shell.html");
const index = join(client, "index.html");
if (!existsSync(shell)) {
  console.error("missing native/www/client/_shell.html");
  process.exit(1);
}
let html = readFileSync(shell, "utf8");
html = html.replaceAll("/./assets/", "./assets/");
html = html.replaceAll('href="/favicon.svg"', 'href="./favicon.svg"');
html = html.replaceAll('href="/__grok/', 'href="./__grok/');
html = html.replaceAll('src="/./assets/', 'src="./assets/');
writeFileSync(index, html);
const privacySrc = join(process.cwd(), "public/privacy.html");
if (existsSync(privacySrc)) copyFileSync(privacySrc, join(client, "privacy.html"));
console.log("native www index.html ready");
