import * as cheerio from "cheerio";
import type { UnifiedJob } from "@/lib/jobs/types";

const TTL_MS = 45 * 60 * 1000;
let cache: { at: number; jobs: UnifiedJob[] } | null = null;

const SEARCHES = [
  "desenvolvedor júnior react node",
  "desenvolvedor trainee tecnologia",
  "desenvolvedor full stack junior",
  "power platform junior",
];

async function fetchSearchPage(keywords: string, start: number): Promise<string> {
  const params = new URLSearchParams({
    keywords,
    location: "Brasil",
    geoId: "106057199",
    f_TPR: "r604800",
    f_E: "2,3",
    start: String(start),
  });
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CentralEmprego/1.0; +https://github.com)",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`LinkedIn guest ${res.status}`);
  return res.text();
}

function parseLinkedInHtml(html: string): UnifiedJob[] {
  const $ = cheerio.load(html);
  const jobs: UnifiedJob[] = [];

  $(".base-search-card, .job-search-card").each((_, el) => {
    const card = $(el);
    const title = card.find(".base-search-card__title").first().text().trim();
    const company = card.find(".base-search-card__subtitle").first().text().trim();
    const location = card.find(".job-search-card__location").first().text().trim();
    let href = card.find("a.base-card__full-link").first().attr("href") ?? "";
    if (!title || !href) return;

    href = href.split("?")[0];
    if (!href.startsWith("http")) {
      href = `https://br.linkedin.com${href}`;
    }

    const idMatch = href.match(/(\d+)\/?$/);
    const id = idMatch ? `linkedin-${idMatch[1]}` : `linkedin-${Buffer.from(href).toString("base64url").slice(0, 16)}`;

    jobs.push({
      id,
      source: "LinkedIn",
      title,
      company: company || "—",
      url: href,
      location: location || "Brasil",
      tags: [],
      publishedAt: new Date().toISOString(),
    });
  });

  return jobs;
}

export async function fetchLinkedInBrazilJobs(): Promise<UnifiedJob[]> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return cache.jobs;
  }

  const all: UnifiedJob[] = [];
  for (const keywords of SEARCHES) {
    for (const start of [0, 25, 50]) {
      try {
        const html = await fetchSearchPage(keywords, start);
        all.push(...parseLinkedInHtml(html));
        await new Promise((r) => setTimeout(r, 400));
      } catch {
        // ignore single page failure
      }
    }
  }

  const seen = new Set<string>();
  const deduped = all.filter((j) => {
    if (seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });

  cache = { at: Date.now(), jobs: deduped };
  return deduped;
}
