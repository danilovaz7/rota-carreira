import { fetchWithTimeout } from "@/lib/jobs/fetch-with-timeout";
import * as cheerio from "cheerio";
import type { JobProfile } from "@/types/job-hunt";
import { buildInternshipSearchTerms } from "@/lib/jobs/profile-search-terms";
import type { UnifiedJob, Workplace } from "@/lib/jobs/types";

const TTL_MS = 30 * 60 * 1000;

const DEFAULT_KEYWORDS = [
  "desenvolvedor junior",
  "desenvolvedor trainee",
  "desenvolvedor full stack junior",
  "power platform junior",
];

const linkedInCache = new Map<string, { at: number; jobs: UnifiedJob[] }>();

const BRAZIL_GEO = "106057199";
const GREATER_SAO_PAULO_GEO = "90009574";
const SANTOS_GEO = "105900002";

type SearchMode = {
  workplace: Workplace;
  params: Record<string, string>;
};

/** LinkedIn f_WT: 1 = presencial, 2 = remoto, 3 = híbrido. */
const REMOTE_MODE: SearchMode = { workplace: "remote", params: { geoId: BRAZIL_GEO, f_WT: "2" } };
const GREATER_SP_MODE: SearchMode = {
  workplace: "onsite",
  params: { geoId: GREATER_SAO_PAULO_GEO, f_WT: "1,3" },
};
const SANTOS_MODE: SearchMode = {
  workplace: "onsite",
  params: { geoId: SANTOS_GEO, f_WT: "1,3", distance: "50" },
};

/** Modos de busca conforme o que o perfil aceita (remoto, regiões, outras cidades). */
function modesForProfile(profile?: JobProfile): SearchMode[] {
  if (!profile) return [REMOTE_MODE, GREATER_SP_MODE, SANTOS_MODE];
  const modes: SearchMode[] = [];
  if (profile.acceptRemote) modes.push(REMOTE_MODE);
  if (profile.acceptOnsite) {
    if (profile.regionGreaterSP) modes.push(GREATER_SP_MODE);
    if (profile.regionBaixada) modes.push(SANTOS_MODE);
    for (const city of profile.extraCities.split(/[,;\n]+/).map((c) => c.trim()).filter(Boolean).slice(0, 2)) {
      modes.push({ workplace: "onsite", params: { location: `${city}, Brasil`, f_WT: "1,3" } });
    }
  }
  return modes;
}

const PAGES = [0, 25];
const INTERNSHIP_PAGES = [0, 25, 50, 75];

/** Para de buscar antes do limite geral da API e devolve o que já achou. */
const LINKEDIN_BUDGET_MS = 20_000;

async function fetchSearchPage(
  keywords: string,
  mode: SearchMode,
  start: number,
  employmentFilter = "2,3",
): Promise<string> {
  const params = new URLSearchParams({
    keywords,
    ...mode.params,
    f_TPR: "r604800",
    f_E: employmentFilter,
    sortBy: "DD",
    start: String(start),
  });
  const res = await fetchWithTimeout(
    `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CentralEmprego/1.0)",
        Accept: "text/html",
      },
    },
    8_000,
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

async function runMode(
  mode: SearchMode,
  keywordsList: string[],
  pages: number[],
  employmentFilter: string,
  collected: UnifiedJob[],
  shouldStop: () => boolean,
): Promise<void> {
  for (const keywords of keywordsList) {
    for (const start of pages) {
      if (shouldStop()) return;
      try {
        const html = await fetchSearchPage(keywords, mode, start, employmentFilter);
        const page = parseLinkedInHtml(html, mode.workplace);
        collected.push(...page);
        if (page.length < 10) break;
      } catch {
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}

export async function fetchLinkedInBrazilJobs(
  searchTerms?: string[],
  profile?: JobProfile,
): Promise<UnifiedJob[]> {
  const includeInternships = profile?.includeInternships ?? false;
  const keywordsList = searchTerms?.length ? searchTerms.slice(0, 8) : DEFAULT_KEYWORDS;
  const internKeywords = includeInternships && profile ? buildInternshipSearchTerms(profile) : [];
  const modes = modesForProfile(profile);
  if (modes.length === 0) return [];

  const modeKey = modes.map((m) => Object.values(m.params).join(":")).join(",");
  const cacheKey = `${includeInternships ? "i:" : ""}${modeKey}|${keywordsList.join("|")}|${internKeywords.join("|")}`;
  const hit = linkedInCache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.jobs;

  const collected: UnifiedJob[] = [];
  let timedOut = false;
  const shouldStop = () => timedOut;

  const tasks = modes.map((mode) =>
    runMode(mode, keywordsList, PAGES, "2,3", collected, shouldStop),
  );
  if (includeInternships && internKeywords.length) {
    tasks.push(
      ...modes.map((mode) =>
        runMode(mode, internKeywords, INTERNSHIP_PAGES, "1,2,3", collected, shouldStop),
      ),
    );
  }

  // Se o LinkedIn estiver lento, devolve o que já foi encontrado em vez de nada.
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        timedOut = true;
        resolve();
      }, LINKEDIN_BUDGET_MS);
    }),
  ]);
  if (timer) clearTimeout(timer);

  const byId = new Map<string, UnifiedJob>();
  for (const job of collected) {
    const existing = byId.get(job.id);
    if (!existing || (existing.workplace !== "remote" && job.workplace === "remote")) {
      byId.set(job.id, job);
    }
  }

  const jobs = [...byId.values()];
  // Só guarda no cache uma busca completa, para a próxima tentar pegar o resto.
  if (jobs.length > 0 && !timedOut) linkedInCache.set(cacheKey, { at: Date.now(), jobs });
  return jobs;
}
