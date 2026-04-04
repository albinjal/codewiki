export interface Section {
  title: string;
  content: string;
}

export interface ParsedContent {
  intro: string;
  sections: Section[];
}

function popTitle(chunk: string): { body: string; title: string } {
  const lines = chunk.replace(/\n+$/, "").split("\n");
  let i = lines.length - 1;
  while (i >= 0 && !lines[i].trim()) i--;
  if (i < 0) return { body: chunk.trim(), title: "" };
  return { body: lines.slice(0, i).join("\n").trim(), title: lines[i].trim() };
}

export function parseContent(text: string): ParsedContent {
  const footerIdx = text.indexOf("\nFAQ\nFeedback\n");
  if (footerIdx !== -1) text = text.slice(0, footerIdx);

  const marker = "Powered by Gemini\nzoom_in\n";
  const preambleEnd = text.indexOf(marker);
  if (preambleEnd !== -1) text = text.slice(preambleEnd + marker.length);

  const parts = text.split(/\nlink\nzoom_in\n/);

  if (parts.length === 1) {
    return { intro: parts[0].trim(), sections: [] };
  }

  const { body: intro, title: pendingTitle } = popTitle(parts[0]);
  let currentTitle = pendingTitle;
  const sections: Section[] = [];

  for (let i = 1; i < parts.length; i++) {
    const isLast = i === parts.length - 1;
    if (!isLast) {
      const { body: content, title: nextTitle } = popTitle(parts[i]);
      sections.push({ title: currentTitle, content });
      currentTitle = nextTitle;
    } else {
      sections.push({ title: currentTitle, content: parts[i].trim() });
    }
  }

  return { intro, sections };
}
