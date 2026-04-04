import { homedir } from "os";
import { join } from "path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { parseContent } from "./parse.js";
import { fetchCodewiki } from "./fetch.js";

export function cacheDir(): string {
  return join(homedir(), ".codewiki", "repos");
}

export function cachePath(slug: string): string {
  const [owner, repo] = slug.split("/", 2);
  return join(cacheDir(), owner, `${repo}.md`);
}

export function writeRepoFile(slug: string, rawText: string, fetchedAt: string): string {
  const outPath = cachePath(slug);
  mkdirSync(join(outPath, ".."), { recursive: true });

  const { intro, sections } = parseContent(rawText);
  const url = `https://codewiki.google/github.com/${slug}`;

  const lines: string[] = [
    "---",
    `slug: ${slug}`,
    `url: ${url}`,
    `fetched_at: ${fetchedAt}`,
    "sections:",
    ...sections.map((s) => `  - ${s.title}`),
    "---",
    "",
  ];

  if (intro) lines.push(intro, "");

  for (const { title, content } of sections) {
    lines.push(`## ${title}`, "", content, "");
  }

  writeFileSync(outPath, lines.join("\n"));
  return outPath;
}

export async function fetchAndCache(slug: string): Promise<string> {
  const raw = await fetchCodewiki(slug);
  const fetchedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return writeRepoFile(slug, raw, fetchedAt);
}

export function readCached(slug: string): string | null {
  const p = cachePath(slug);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}
