import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const findings = [];
function ok(area, detail) {
  findings.push({ sev: "pass", area, detail });
  console.log("PASS", area, "—", detail);
}
function fail(area, detail) {
  findings.push({ sev: "fail", area, detail });
  console.log("FAIL", area, "—", detail);
}
function warn(area, detail) {
  findings.push({ sev: "warn", area, detail });
  console.log("WARN", area, "—", detail);
}
function note(area, detail) {
  findings.push({ sev: "note", area, detail });
  console.log("NOTE", area, "—", detail);
}

async function text(page) {
  return page.locator("body").innerText();
}
async function h1(page) {
  return (await page.locator("h1").allTextContents()).join(" | ");
}

async function goMore(page, label) {
  const toast = page.locator(".feedback-dock button");
  if (await toast.count()) await toast.first().click().catch(() => {});
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.waitForTimeout(120);
  await page.locator(".more-sheet-list").getByRole("button", { name: new RegExp(`^${label}`) }).click();
}

async function dismissPresser(page) {
  for (let i = 0; i < 6; i++) {
    const choices = page.locator("[data-presser-choice]");
    if (await choices.count()) {
      await choices.first().click();
      await page.waitForTimeout(280);
      continue;
    }
    if (await page.getByRole("button", { name: "Back to office" }).count()) {
      await page.getByRole("button", { name: "Back to office" }).click();
      await page.waitForTimeout(250);
      return;
    }
    break;
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

try {
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForFunction(
    () => document.documentElement.classList.contains("title-armed") || !document.querySelector(".title-screen.is-booting"),
    { timeout: 15000 },
  ).catch(() => {});
  const t0 = await text(page);
  if (t0.includes("Career") && t0.includes("Pick a school") && t0.includes("Eras") && t0.includes("Hall of Fame")) {
    ok("Title", "Career, Pick a school, Eras, Hall of Fame visible");
  } else fail("Title", `Missing menu: ${t0.slice(0, 200)}`);
  if (t0.includes("Load game")) ok("Title", "Load game always on menu");
  else fail("Title", "Load game missing on empty save");
  if (t0.includes("Continue") && !t0.includes("The gym's opening")) warn("Title", "Continue shown with no save");
  else ok("Title", "Continue hidden until a save exists");

  // Hof
  await page.getByRole("button", { name: "Hall of Fame" }).click();
  await page.waitForTimeout(400);
  if ((await h1(page)).includes("Hall of Fame")) ok("HoF", "Opens from title");
  else fail("HoF", await h1(page));
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(300);

  // Files from title with no save
  await page.getByRole("button", { name: "Load game" }).click();
  await page.waitForTimeout(400);
  if ((await h1(page)).includes("Load game")) ok("Load game", "Opens from title with empty list");
  else fail("Load game", await h1(page));
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(300);

  // Eras
  await page.getByRole("button", { name: "Eras" }).click();
  await page.waitForTimeout(400);
  const eras = await text(page);
  if (eras.includes("1960s") && eras.includes("2020s")) ok("Eras", "All decades listed");
  else fail("Eras", eras.slice(0, 200));
  await page.getByRole("button", { name: /1960s/ }).click();
  await page.waitForTimeout(400);
  if ((await h1(page)).includes("Create a coach")) ok("Eras", "1960s opens create coach");
  else fail("Eras", `After 1960s: ${await h1(page)}`);
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(300);

  // Career
  await page.getByRole("button", { name: "Career" }).click();
  await page.waitForTimeout(400);
  if ((await h1(page)).includes("Create a coach")) ok("Career", "Opens create coach");
  else fail("Career", await h1(page));
  await page.getByRole("button", { name: "Import team names" }).click();
  await page.waitForTimeout(400);
  if ((await h1(page)).includes("Names")) ok("Names", "Import from career create");
  else fail("Names", await h1(page));
  const namesText = await text(page);
  if (namesText.includes("Active:")) ok("Names", "Shows active pack");
  else warn("Names", "No active pack line");
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Choose first job" }).click();
  await page.waitForTimeout(500);
  if ((await h1(page)).includes("First job")) ok("Career", "First job list");
  else fail("Career", await h1(page));
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(300);

  // Dynasty start
  await page.getByRole("button", { name: "Pick a school" }).click();
  await page.waitForTimeout(500);
  if ((await h1(page)).includes("Take the job")) ok("Dynasty", "School picker opens");
  else fail("Dynasty", await h1(page));
  const lis = await page.locator("ul li").count();
  if (lis >= 20 && lis <= 30) ok("Dynasty", `Capped list ${lis} schools`);
  else warn("Dynasty", `List count ${lis}`);
  await page.locator("ul li").first().getByRole("button").click();
  await page.getByRole("button", { name: "Take this job" }).waitFor({ timeout: 5000 });
  ok("Dynasty", "School selected, take-job footer up");
  await page.getByRole("button", { name: "Take this job" }).click();
  try {
    await page.getByRole("button", { name: "Skip tutorial" }).waitFor({ timeout: 45000 });
    ok("Start", "Tutorial after job start");
    await page.getByRole("button", { name: "Skip tutorial" }).click();
  } catch {
    const ht = await h1(page);
    if (ht && !ht.includes("Dribble")) ok("Start", `Skipped tutorial, landed ${ht}`);
    else fail("Start", `Did not reach tutorial or office: ${ht} ${(await text(page)).slice(0, 180)}`);
  }
  await page.waitForTimeout(600);
  const office = await text(page);
  if (office.includes("Customize schedule") || office.includes("Begin season") || (office.includes("Office") && (await h1(page)).length)) {
    ok("Office", `Landed in office: ${(await h1(page))}`);
  } else if (office.includes("Play game") || office.includes("Sim week")) {
    ok("Office", `Landed in office: ${(await h1(page))}`);
  } else fail("Office", office.slice(0, 250));

  // Dock + more
  const dock = ["Office", "Roster", "Games", "Recruit"];
  for (const d of dock) {
    await page.getByRole("button", { name: d, exact: true }).click();
    await page.waitForTimeout(250);
    const hx = await h1(page);
    if (hx.length) ok(`Dock/${d}`, hx);
    else fail(`Dock/${d}`, "No heading");
  }

  await page.getByRole("button", { name: "Office", exact: true }).click();
  await page.waitForTimeout(200);

  // Customize / begin season
  if ((await text(page)).includes("Customize schedule")) {
    await page.getByRole("button", { name: "Customize schedule" }).click();
    await page.waitForTimeout(400);
    const sch = await text(page);
    if (sch.includes("Schedule") || sch.includes("Customize") || sch.includes("Week 1")) ok("Schedule", "Calendar weeks visible");
    else fail("Schedule", sch.slice(0, 200));
    const join = page.getByRole("button", { name: "Join" }).first();
    if (await join.count()) {
      await join.click();
      await page.waitForTimeout(400);
      const afterJoin = await text(page);
      if (afterJoin.includes("In") || afterJoin.toLowerCase().includes("classic") || afterJoin.includes("Holiday")) {
        ok("MTE", "Joined a holiday event");
      } else warn("MTE", afterJoin.slice(0, 120));
    } else warn("MTE", "No Join button");
    const addBtn = page.getByRole("button", { name: "Add" }).first();
    if (await addBtn.count()) {
      await addBtn.click();
      await page.waitForTimeout(300);
      ok("Schedule", "Added a non-con game");
    }
    const beginBtn = page.getByRole("button", { name: /Begin season/ });
    if (await beginBtn.count()) {
      await beginBtn.click();
      const w = Date.now();
      while (Date.now() - w < 15000) {
        const t = await text(page);
        if (t.includes("Sim week") || t.includes("Play game") || t.includes("Season's underway")) break;
        await page.waitForTimeout(400);
      }
      ok("Schedule", "Began season");
    } else warn("Schedule", "No begin button (already regular?)");
  } else note("Schedule", "Not preseason — already locked");

  // Back to office via dock
  await page.getByRole("button", { name: "Office", exact: true }).click();
  await page.waitForTimeout(400);

  // Sim game
  if (await page.getByRole("button", { name: "Sim game" }).count()) {
    await page.getByRole("button", { name: "Sim game" }).click();
    const w = Date.now();
    while (Date.now() - w < 20000) {
      const rec = await text(page);
      if (rec.includes("Playing the game") || rec.includes("Playing the week")) {
        await page.waitForTimeout(400);
        continue;
      }
      break;
    }
    await page.waitForTimeout(600);
    const rec = await text(page);
    if (rec.toLowerCase().includes("recap") || rec.includes("Win") || rec.includes("Loss") || rec.includes("PPP")) {
      ok("Recap", `After sim game: ${(await h1(page)).slice(0, 80)}`);
      const recapGo = page.locator("button.recap-done");
      if (await recapGo.count()) await recapGo.first().click();
      else {
        const back = page.getByRole("button", { name: "Back" });
        if (await back.count()) await back.first().click();
      }
      await page.waitForTimeout(400);
      await dismissPresser(page);
    } else if (rec.includes("question") || rec.includes("Podium") || (await page.locator("[data-presser-choice]").count())) {
      ok("Presser", "Press conference after game");
      await dismissPresser(page);
    } else fail("Sim game", rec.slice(0, 250));
  } else warn("Sim game", "Button missing on office");

  await dismissPresser(page);

  await page.getByRole("button", { name: "Office", exact: true }).click().catch(() => {});
  await page.waitForTimeout(300);

  // Play game
  if (await page.getByRole("button", { name: "Play game" }).count()) {
    await page.getByRole("button", { name: "Play game" }).click();
    await page.waitForTimeout(800);
    const gt = await text(page);
    if (gt.includes("Tip off") || gt.includes("Gameplan") || gt.includes("mix and match")) {
      ok("Live", "Pregame gameplan");
      const tip = page.getByRole("button", { name: "Tip off" });
      if (await tip.count()) {
        await tip.click();
        await page.waitForTimeout(500);
      }
    }
    const gt2 = await text(page);
    if (gt2.includes("pick a call") || gt2.includes("pick a defense") || gt2.includes("Sim rest") || gt2.includes("Final") || gt2.includes("Game's over") || gt2.includes("Halftime") || gt2.includes("mix the plan")) {
      ok("Live", "Play-by-play opened");
      const call = page.getByRole("button", { name: /Motion|Pick & roll|Post up|Man|2-3 zone|Pack-line/ }).first();
      if (await call.count()) {
        const callName = (await call.textContent())?.trim() || "play";
        await call.click();
        await page.waitForTimeout(400);
        ok("Live", `Called a play: ${callName}`);
      }
      if (await page.getByRole("button", { name: "Sim rest of game" }).count()) {
        await page.getByRole("button", { name: "Sim rest of game" }).click();
        await page.waitForTimeout(1500);
        if (await page.getByRole("button", { name: "Read recap" }).count()) {
          await page.getByRole("button", { name: "Read recap" }).click();
          await page.waitForTimeout(500);
          ok("Live", "Sim rest → recap");
          const recapGo = page.locator("button.recap-done");
          if (await recapGo.count()) await recapGo.first().click();
          else {
            const b = page.getByRole("button", { name: "Back" });
            if (await b.count()) await b.click();
          }
          await page.waitForTimeout(400);
          await dismissPresser(page);
        } else warn("Live", `After sim rest: ${(await h1(page))}`);
      }
    } else fail("Live", gt.slice(0, 250));
  } else warn("Live", "Play game missing");

  await dismissPresser(page);
  await page.getByRole("button", { name: "Office", exact: true }).click().catch(() => {});
  await page.waitForTimeout(300);

  // Roster
  await page.getByRole("button", { name: "Roster", exact: true }).click();
  await page.waitForTimeout(400);
  const rost = await text(page);
  if (/chemistry/i.test(rost) && /roster/i.test(rost)) ok("Roster", "Chemistry + player list");
  else fail("Roster", rost.slice(0, 200));
  const player = page.locator("ul li button").first();
  if (await player.count()) {
    await player.click();
    await page.waitForTimeout(200);
    ok("Roster", "Player expands");
    if (await page.getByRole("button", { name: "Check in" }).count()) {
      await page.getByRole("button", { name: "Check in" }).click();
      await page.waitForTimeout(300);
      ok("Roster", "Check in");
    }
    if (await page.getByRole("button", { name: "Redshirt" }).count()) {
      ok("Roster", "Redshirt control");
    } else warn("Roster", "No redshirt on first player (maybe senior / already used)");
    if (await page.getByRole("button", { name: "Hold him to the film" }).count()) {
      await page.getByRole("button", { name: "Hold him to the film" }).click();
      await page.waitForTimeout(200);
      ok("Roster", "Hold accountable");
    }
    if (await page.getByRole("button", { name: "Promise minutes" }).count()) {
      ok("Roster", "Promise controls");
    }
    const plus = page.getByRole("button", { name: "+", exact: true }).first();
    if (await plus.count()) {
      await plus.click();
      await page.waitForTimeout(200);
      ok("Roster", "Minutes bump");
    }
  }

  // Recruit
  await page.getByRole("button", { name: "Recruit", exact: true }).click();
  await page.waitForTimeout(400);
  const rec = await text(page);
  if (rec.includes("Recruiting") && rec.includes("Assisted recruiting") && rec.includes("Targets") && rec.includes("Board") && rec.includes("JUCO") && rec.includes("Portal")) {
    ok("Recruiting", "Tabs + assisted checkbox + JUCO + Portal");
  } else fail("Recruiting", rec.slice(0, 200));
  await page.getByRole("button", { name: /^Targets/ }).click();
  await page.waitForTimeout(200);
  ok("Recruiting", "Targets tab");
  await page.getByRole("button", { name: "JUCO" }).click();
  await page.waitForTimeout(200);
  const jucoTxt = await text(page);
  if (jucoTxt.includes("JUCO") || jucoTxt.includes("★")) ok("Recruiting", "JUCO tab has class");
  else fail("Recruiting", jucoTxt.slice(0, 180));
  await page.getByRole("button", { name: /^Portal/ }).click();
  await page.waitForTimeout(200);
  const portTxt = await text(page);
  if (portTxt.toLowerCase().includes("portal") || portTxt.includes("window") || portTxt.includes("closed")) ok("Recruiting", "Portal tab opens");
  else fail("Recruiting", portTxt.slice(0, 180));
  await page.getByRole("button", { name: "Board 100" }).click();
  await page.waitForTimeout(200);
  ok("Recruiting", "Board 100 tab");
  const scout = page.getByRole("button", { name: "Scout" }).first();
  if (await scout.count()) {
    await scout.click();
    await page.waitForTimeout(200);
    ok("Recruiting", "Scout action");
  } else warn("Recruiting", "No Scout button on Board 100 (maybe hours/staff)");
  const offer = page.getByRole("button", { name: "Offer" }).first();
  if (await offer.count()) {
    await offer.click();
    await page.waitForTimeout(250);
    ok("Recruiting", "Offer action");
  }
  const visit = page.getByRole("button", { name: "Visit" }).first();
  if (await visit.count()) {
    await visit.click();
    await page.waitForTimeout(250);
    ok("Recruiting", "Visit action");
  }

  // More screens
  const moreItems = [
    ["Inbox", "Inbox"],
    ["News", "News"],
    ["Ranks", null],
    ["Tape", null],
    ["Betting odds", "Betting odds"],
    ["Bracket", null],
    ["Contract", "Contract"],
    ["Draft", "Draft"],
    ["Camp", "Camp"],
    ["Awards", "Awards"],
    ["Compliance", "Compliance"],
    ["Hall of Fame", "Hall of Fame"],
    ["Saves", "Saves"],
    ["Names", "Names"],
  ];
  for (const [label, expectH] of moreItems) {
    try {
      const toast = page.locator(".feedback-dock button");
      if (await toast.count()) await toast.first().click().catch(() => {});
      await page.getByRole("button", { name: "Office", exact: true }).click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(150);
      if (!(await page.getByRole("button", { name: "More", exact: true }).count())) {
        const back = page.getByRole("button", { name: "Back" }).or(page.getByRole("button", { name: /Office/ }));
        if (await back.count()) await back.first().click();
        await page.waitForTimeout(250);
      }
      await goMore(page, label);
      await page.waitForTimeout(400);
      const body = await text(page);
      const hx = await h1(page);
      if (expectH && !hx.includes(expectH) && !body.includes(expectH)) fail(`More/${label}`, `Got "${hx}"`);
      else ok(`More/${label}`, hx || body.split("\n")[0]);
      const dockLeft = await page.getByRole("button", { name: "More", exact: true }).count();
      if (!dockLeft) fail(`More/${label}`, "Dock dropped");
      else ok(`More/${label} dock`, "Tab bar stayed");
      if (label === "Ranks") {
        for (const tab of ["Conference", "NET", "KenPom", "AP Poll"]) {
          if (await page.getByRole("button", { name: tab, exact: true }).count()) {
            await page.getByRole("button", { name: tab, exact: true }).click();
            await page.waitForTimeout(150);
            ok("Ranks", `${tab} tab`);
          } else fail("Ranks", `Missing ${tab}`);
        }
      }
      if (label === "Bracket") {
        for (const tab of ["Bracketology", "Field of 68"]) {
          if (await page.getByRole("button", { name: tab }).count()) {
            await page.getByRole("button", { name: tab }).click();
            await page.waitForTimeout(150);
            ok("Bracket", tab);
          }
        }
      }
      if (label === "Betting odds") {
        const board = page.locator(".mkt-odds").first();
        const ml = page.locator(".mkt-odds-row .tabular-nums").first();
        if (await board.count() && await ml.count()) ok("Betting odds", "Odds board (spread / ML / total)");
        else warn("Betting odds", "No lines this week");
        if (await page.locator(".mkt-chip").count()) fail("Betting odds", "Betting chips still on the board");
      }
      if (label === "Names") {
        const restore = page.getByRole("button", { name: "Restore original school names" });
        if (await restore.count()) {
          await restore.click();
          await page.waitForTimeout(800);
          const nt = await text(page);
          if (nt.includes("Kentucky") || nt.toLowerCase().includes("active")) ok("Names", "Restore original names");
          else warn("Names", nt.slice(0, 120));
        }
      }
    } catch (e) {
      fail(`More/${label}`, e.message);
    }
  }

  // Save now from office
  await page.getByRole("button", { name: "Back" }).click().catch(() => {});
  await page.waitForTimeout(200);
  if (await page.getByRole("button", { name: "Office", exact: true }).count()) {
    await page.getByRole("button", { name: "Office", exact: true }).click();
    await page.waitForTimeout(200);
    if (await page.getByRole("button", { name: "Save now" }).count()) {
      await page.getByRole("button", { name: "Save now" }).click();
      await page.waitForTimeout(400);
      ok("Saves", "Save now clicked");
    }
    if (await page.getByRole("button", { name: "Files" }).count()) {
      await page.getByRole("button", { name: "Files" }).click();
      await page.waitForTimeout(400);
      const sv = await text(page);
      if (sv.includes("Saves")) ok("Saves", "Files list");
      else fail("Saves", sv.slice(0, 150));
      await page.getByRole("button", { name: "Back" }).click();
    }
  }

  // Title from chrome
  if (await page.getByRole("button", { name: "Title" }).count()) {
    await page.getByRole("button", { name: "Title" }).click();
    await page.waitForTimeout(400);
    const tt = await text(page);
    if (tt.includes("Career") && tt.includes("Continue")) ok("Title return", "Continue appears after save");
    else if (tt.includes("Career")) ok("Title return", "Back to title");
    else fail("Title return", tt.slice(0, 150));
  }

  // Continue
  if (await page.getByRole("button", { name: "Continue" }).count()) {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(800);
    const toast = page.locator(".feedback-dock button");
    if (await toast.count()) await toast.first().click().catch(() => {});
    await page.waitForTimeout(200);
    await dismissPresser(page);
    if (!(await page.getByRole("button", { name: "Office", exact: true }).count())) {
      const backOffice = page.getByRole("button", { name: /Office|Back to office|Read recap|Back/ });
      if (await backOffice.count()) await backOffice.first().click();
      await page.waitForTimeout(400);
    }
    if (await page.getByRole("button", { name: "Office", exact: true }).count()) {
      await page.getByRole("button", { name: "Office", exact: true }).click();
      await page.waitForTimeout(200);
    }
    if ((await text(page)).includes("Office") || (await page.getByRole("button", { name: "More", exact: true }).count()) || (await h1(page)).length) {
      ok("Continue", (await h1(page)) || "resumed");
    } else fail("Continue", (await text(page)).slice(0, 150));
  } else warn("Continue", "No continue on title after job");

  // Desktop width
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);
  if (await page.getByRole("button", { name: "Office", exact: true }).count()) {
    await page.getByRole("button", { name: "Office", exact: true }).click();
    await page.waitForTimeout(200);
    ok("Desktop", "Office at 1280");
  } else warn("Desktop", "Dock missing at 1280");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  if (await page.getByRole("button", { name: "More", exact: true }).count()) {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.waitForTimeout(200);
    const sheet = await page.locator(".more-sheet").last().boundingBox();
    if (sheet) {
      if (sheet.y < 0) warn("More sheet", `Top clipped y=${sheet.y}`);
      if (sheet.y + sheet.height > 844) warn("More sheet", `Bottom overflow ${Math.round(sheet.y + sheet.height - 844)}px`);
      else ok("More sheet", `Fits viewport h=${Math.round(sheet.height)}`);
    } else warn("More sheet", "No box");
  } else warn("More sheet", "No More button after continue");
} catch (e) {
  fail("Runner", e.message);
}

if (errors.length) {
  for (const e of errors.slice(0, 8)) fail("JS error", e);
} else ok("JS", "No page errors");

await page.screenshot({ path: "/workspace/screenshots/stress-end.png" });
await browser.close();

const summary = {
  pass: findings.filter((f) => f.sev === "pass").length,
  fail: findings.filter((f) => f.sev === "fail").length,
  warn: findings.filter((f) => f.sev === "warn").length,
  note: findings.filter((f) => f.sev === "note").length,
  findings,
};
writeFileSync("/tmp/dribble-stress.json", JSON.stringify(summary, null, 2));
console.log("\nSUMMARY", summary.pass, "pass", summary.fail, "fail", summary.warn, "warn");
