import * as cheerio from "cheerio";
import type { UnifiedJob, Workplace } from "@/lib/jobs/types";

const TTL_MS = 30 * 60 * 1000;
let cache: { at: number; jobs: UnifiedJob[] } | null = null;

const KEYWORDS = [
  "desenvolvedor junior",
  "desenvolvedor trainee",
  "desenvolvedor full stack junior",
  "power platform junior",
];

const BRAZIL_GEO = "106057199";
const GREATER_SAO_PAULO_GEO = "90009574";
const SANTOS_GEO = "105900002";

type SearchMode = {
  workplace: Workplace;
  params: Record<string, string>;
};

/** LinkedIn f_WT: 1 = presencial, 2 = remoto, 3 = híbrido. */
const MODES: SearchMode[] = [
  { workplace: "remote", params: { geoId: BRAZIL_GEO, f_WT: "2" } },
  { workplace: "onsite", params: { geoId: GREATER_SAO_PAULO_GEO, f_WT: "1,3" } },
  { workplace: "onsite", params: { geoId: SANTOS_GEO, f_WT: "1,3", distance: "50" } },
];

const PAGES = [0, 25];

async function fetchSearchPage(
  keywords: string,
  mode: SearchMode,
  start: number,
): Promise<string> {
  const params = new URLSearchParams({
    keywords,
    ...mode.params,
    f_TPR: "r604800",
    f_E: "2,3",
    sortBy: "DD",
    start: String(start),
  });
  const res = await fetch(
    `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CentralEmprego/1.0)",
        Accept: "text/html",
      },
    },
  );
  if (!res.ok) throw new Error(`LinkedIn guest ${res.status}`);
  return res.text();
}

function parseLinkedInHtml(html: string, workplace: Workplace): UnifiedJob[] {
  const $ = cheerio.load(html);
  const jobs: UnifiedJob[] = [];

  $(".base-search-card").each((_, el) => {
    const card = $(el);
    const title = card.find(".base-search-card__title").first().text().trim();
    const company = card.find(".base-search-card__subtitle").first().text().trim();
    const location = card.find(".job-search-card__location").first().text().trim();
    const time = card.find("time").first();
    let href = card.find("a.base-card__full-link").first().attr("href") ?? "";
    if (!title || !href) return;

    href = href.split("?")[0];
    const idMatch = href.match(/(\d+)\/?$/);
    if (!idMatch) return;

    jobs.push({
      id: `linkedin-${idMatch[1]}`,
      source: "LinkedIn",
      title,
      company: company || "—",
      url: href,
      location: location || "Brasil",
      tags: [],
      publishedAt: time.attr("datetime") ?? "",
      workplace,
      isNew: time.hasClass("job-search-card__listdate--new"),
    });
  });

  return jobs;
}

async function runMode(mode: SearchMode): Promise<UnifiedJob[]> {
  const jobs: UnifiedJob[] = [];
  for (const keywords of KEYWORDS) {
    for (const start of PAGES) {
      try {
        const html = await fetchSearchPage(keywords, mode, start);
        const page = parseLinkedInHtml(html, mode.workplace);
        jobs.push(...page);
        if (page.length < 10) break;
      } catch {
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return jobs;
}

export async function fetchLinkedInBrazilJobs(): Promise<UnifiedJob[]> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return cache.jobs;
  }

  const results = await Promise.allSettled(MODES.map(runMode));
  const byId = new Map<string, UnifiedJob>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const job of r.value) {
      const existing = byId.get(job.id);
      if (!existing || (existing.workplace !== "remote" && job.workplace === "remote")) {
        byId.set(job.id, job);
      }
    }
  }

  const jobs = [...byId.values()];
  if (jobs.length > 0) {
    cache = { at: Date.now(), jobs };
  }
  return jobs;
}
