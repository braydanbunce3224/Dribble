#!/usr/bin/env node
import { mkdirSync, existsSync } from "node:fs";
import { chromium } from "playwright";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:8080/";
const savePath = "/workspace/public/qa-save.json";
mkdirSync("/workspace/screenshots", { recursive: true });
const issues = [];
function note(msg) {
  issues.push(msg);
  console.log("ISSUE", msg);
}

const browser = await chromium.launch({ headless: true });

async function run(name, viewport) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(8000);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const injected = await page.evaluate(async () => {
    try {
      const raw = await (await fetch("/qa-save.json")).text();
      localStorage.setItem("dribble-2026.save.v1", raw);
      localStorage.setItem("dribble-2026.tutorial", "1");
      return raw.length;
    } catch (e) {
      return String(e);
    }
  });
  console.log(name, "injected", injected);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  async function shot(tag) {
    await page.screenshot({ path: `/workspace/screenshots/rel-${name}-${tag}.png`, timeout: 4000 }).catch(() => {});
  }
  async function tap(label) {
    const b = page.getByRole("button", { name: label, exact: true }).first();
    if (!(await b.count())) {
      note(`${name} missing ${label}`);
      return false;
    }
    await b.click({ timeout: 5000 }).catch(() => b.click({ force: true, timeout: 3000 }).catch(() => {}));
    await page.waitForTimeout(180);
    return true;
  }
  async function has(text) {
    return page.getByText(text, { exact: false }).first().isVisible().catch(() => false);
  }

  console.log(name, "title");
  if (!(await has("Career"))) note(`${name} no Career`);
  await shot("title");
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Hall of Fame");
    b?.click();
  });
  await page.waitForTimeout(400);
  if (!(await has("Hall of Fame"))) note(`${name} hof`);
  await shot("hof");
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Back");
    b?.click();
  });
  await page.waitForTimeout(300);

  await tap("Eras");
  if (!(await has("Westwood"))) note(`${name} eras`);
  await tap("Back");
  await tap("Pick a school");
  if (!(await has("Take the job"))) note(`${name} dynasty`);
  await tap("Back");

  console.log(name, "continue");
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Continue");
    b?.click();
  });
  await page.waitForTimeout(800);
  await shot("hub");
  if (!(await has("Chemistry"))) note(`${name} chemistry card`);
  if (!(await has("Contract"))) note(`${name} contract card`);
  if (!(await has("Compliance"))) note(`${name} compliance card`);

  for (const d of ["Office", "Roster", "Games", "Recruit", "More"]) {
    const b = page.getByRole("button", { name: d, exact: true }).first();
    if (!(await b.count())) note(`${name} dock ${d}`);
    else {
      await b.click().catch(() => {});
      await page.waitForTimeout(160);
    }
  }
  await shot("more");

  async function openMore() {
    const more = page.getByRole("button", { name: "More", exact: true }).first();
    if (await more.count()) await more.click().catch(() => {});
    await page.waitForTimeout(160);
  }

  for (const item of ["Inbox", "Contract", "Compliance", "Ranks", "Bracket", "News"]) {
    await openMore();
    const b = page.getByRole("button", { name: new RegExp(`^${item}\\b`) }).first();
    if (!(await b.count())) note(`${name} more ${item}`);
    else {
      await b.click().catch(() => {});
      await page.waitForTimeout(220);
      console.log(name, item);
      await shot(item.toLowerCase());
    }
  }

  const office = page.getByRole("button", { name: "Office", exact: true }).first();
  if (await office.count()) await office.click().catch(() => {});
  await page.waitForTimeout(200);
  if (await page.getByRole("button", { name: "Play game" }).count()) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => x.textContent === "Play game");
      b?.click();
    });
    await page.waitForTimeout(600);
    await shot("game");
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /Sim rest/.test(x.textContent || ""));
      b?.click();
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /Continue|Office/.test(x.textContent || ""));
      b?.click();
    });
  }

  const box = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, vw: window.innerWidth }));
  if (box.w > box.vw + 2) note(`${name} horizontal overflow ${box.w} > ${box.vw}`);
  await page.close();
}

await run("mobile", { width: 390, height: 844 });
await run("desktop", { width: 1280, height: 800 });
await browser.close();
console.log("ISSUES", issues.length);
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("RELEASE QA OK");
}
