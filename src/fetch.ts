import { chromium } from "playwright";

export async function fetchCodewiki(slug: string): Promise<string> {
  const url = `https://codewiki.google/github.com/${slug}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("router-outlet + *", { timeout: 20000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    const text = await page.innerText("router-outlet + *");
    if (!text.includes("Powered by Gemini")) {
      throw new Error(`No codewiki page found for ${slug}`);
    }
    return text;
  } finally {
    await browser.close();
  }
}
