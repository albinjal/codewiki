import { Command } from "commander";
import { fetchAndCache, readCached, cachePath } from "./cache.js";

const program = new Command();

program
  .name("codewiki")
  .description("Fetch and read Code Wiki docs for GitHub repos")
  .version("0.1.0");

program
  .command("fetch")
  .description("Fetch docs for one or more repos")
  .argument("<slugs...>", "owner/repo slugs, e.g. torvalds/linux")
  .option("-c, --concurrency <n>", "max parallel fetches", "5")
  .action(async (slugs: string[], opts: { concurrency: string }) => {
    const concurrency = parseInt(opts.concurrency, 10);
    const semaphore = new Semaphore(concurrency);

    await Promise.all(
      slugs.map((slug) =>
        semaphore.run(async () => {
          console.log(`Fetching ${slug}...`);
          try {
            const path = await fetchAndCache(slug);
            console.log(`  Wrote ${path}`);
          } catch (e) {
            console.log(`  Failed: ${slug} — ${e}`);
          }
        })
      )
    );
  });

program
  .command("read")
  .description("Read docs for a repo")
  .argument("<slug>", "owner/repo slug")
  .option("-s, --section <name>", "print a specific section only")
  .option("-l, --list-sections", "list available sections")
  .action(async (slug: string, opts: { section?: string; listSections?: boolean }) => {
    let text = readCached(slug);

    if (!text) {
      console.error(`No cache for ${slug}, fetching...`);
      try {
        const path = await fetchAndCache(slug);
        console.error(`  Cached at ${path}`);
        const { readFileSync } = await import("fs");
        text = readFileSync(cachePath(slug), "utf8");
      } catch (e) {
        console.error(`Fetch failed: ${e}`);
        process.exit(1);
      }
    }

    if (opts.listSections) {
      let inFm = false;
      let inSections = false;
      for (const line of text.split("\n")) {
        if (line === "---") {
          if (!inFm) { inFm = true; continue; }
          else break;
        }
        if (inFm && line === "sections:") { inSections = true; continue; }
        if (inSections && line.startsWith("  - ")) { console.log(line.slice(4)); continue; }
        if (inSections) inSections = false;
      }
      return;
    }

    if (opts.section) {
      const heading = `## ${opts.section}`;
      const lines = text.split("\n");
      const start = lines.findIndex((l) => l === heading);
      if (start === -1) {
        console.error(`Section not found: ${JSON.stringify(opts.section)}`);
        process.exit(1);
      }
      const end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
      console.log(lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim());
      return;
    }

    console.log(text);
  });

program.parse();

class Semaphore {
  private queue: (() => void)[] = [];
  private active = 0;

  constructor(private readonly limit: number) {}

  run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.active++;
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          this.active--;
          if (this.queue.length > 0) this.queue.shift()!();
        }
      };
      if (this.active < this.limit) execute();
      else this.queue.push(execute);
    });
  }
}
