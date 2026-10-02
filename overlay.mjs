import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new" });
const page = await browser.newPage(); await page.setBypassCSP(true);
for (const [w, h] of [[390, 844], [360, 740]]) {
  await page.setViewport({ width: w, height: h });
  await page.goto("http://localhost:8091/", { waitUntil: "networkidle0" });
  await page.click("[data-nav-toggle]");
  await new Promise(r => setTimeout(r, 500));
  const info = await page.evaluate(() => {
    const overlay = document.documentElement.classList.contains("nav-open");
    const style = getComputedStyle(document.body, "::after");
    const bar = document.querySelector(".mobile-cta");
    return { overlay, bg: style.backgroundColor, z: style.zIndex, cover: style.position === "fixed", bar: getComputedStyle(bar).transform };
  });
  await page.screenshot({ path: `open-${w}.png` });
  console.log(w, JSON.stringify(info));
}
await browser.close();
