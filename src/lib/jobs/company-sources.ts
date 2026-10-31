import { fetchWithTimeout } from "@/lib/jobs/fetch-with-timeout";
import type { UnifiedJob, Workplace } from "@/lib/jobs/types";
import { stripHtml } from "@/lib/jobs/strip-html";

const TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; jobs: UnifiedJob[] }>();

async function cached(key: string, loader: () => Promise<UnifiedJob[]>) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.jobs;
  const jobs = await loader();
  if (jobs.length > 0) cache.set(key, { at: Date.now(), jobs });
  return jobs;
}

const UA = { "User-Agent": "Mozilla/5.0 (compatible; CentralEmprego/1.0)" };

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const item = items[i++];
      try {
        out.push(await fn(item));
      } catch {
        // one failed board/page must not drop the others
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function remoteFromText(text: string): Workplace {
  return /\b(remote|remoto|home office)\b/i.test(text) ? "remote" : "onsite";
}

/** Sites de carreira hospedados no Greenhouse (token do board → nome exibido). */
export const GREENHOUSE_COMPANIES: Record<string, string> = {
  nubank: "Nubank",
  inter: "Banco Inter",
  c6bank: "C6 Bank",
  xpinc: "XP Inc.",
  btgpactual: "BTG Pactual",
  stone: "Stone",
  quintoandar: "QuintoAndar",
  vtex: "VTEX",
  ebanx: "EBANX",
  wildlifestudios: "Wildlife Studios",
  gympass: "Wellhub (Gympass)",
  rdstation: "RD Station",
  thoughtworks: "Thoughtworks",
  jusbrasil: "Jusbrasil",
  blip: "Blip",
};

export const LEVER_COMPANIES: Record<string, string> = {
  ciandt: "CI&T",
  neon: "Neon",
  cloudwalk: "CloudWalk",
};

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string };
  first_published?: string;
  updated_at: string;
  content?: string;
};

async function fetchGreenhouseBoard(token: string, company: string): Promise<UnifiedJob[]> {
  const res = await fetchWithTimeout(
    `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
    { headers: UA },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { jobs: GreenhouseJob[] };
  return (data.jobs ?? []).map((j) => {
    const description = j.content
      ? stripHtml(j.content.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")).slice(0, 3000)
      : undefined;
    return {
      id: `greenhouse-${token}-${j.id}`,
      source: "Site da empresa" as const,
      title: j.title,
      company,
      url: j.absolute_url,
      location: j.location?.name ?? "",
      tags: [],
      publishedAt: j.first_published ?? j.updated_at,
      description,
      workplace: remoteFromText(`${j.location?.name ?? ""} ${j.title}`),
    };
  });
}

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt: number;
  workplaceType?: string;
  categories?: { location?: string; allLocations?: string[]; commitment?: string };
  descriptionPlain?: string;
};

async function fetchLeverBoard(token: string, company: string): Promise<UnifiedJob[]> {
  const res = await fetchWithTimeout(`https://api.lever.co/v0/postings/${token}?mode=json`, {
    headers: UA,
  });
  if (!res.ok) return [];
  const data = (await res.json()) as LeverPosting[];
  return data.map((j) => {
    const locations = j.categories?.allLocations?.length
      ? j.categories.allLocations
      : [j.categories?.location ?? ""];
    return {
      id: `lever-${token}-${j.id}`,
      source: "Site da empresa" as const,
      title: j.text,
      company,
      url: j.hostedUrl,
      location: locations.filter(Boolean).join("; "),
      tags: [j.categories?.commitment ?? ""].filter(Boolean),
      publishedAt: new Date(j.createdAt).toISOString(),
      description: j.descriptionPlain?.slice(0, 3000),
      workplace:
        j.workplaceType === "remote"
          ? ("remote" as const)
          : j.workplaceType
            ? ("onsite" as const)
            : remoteFromText(locations.join(" ")),
    };
  });
}

type EightfoldPosition = {
  id: number;
  name: string;
  locations: string[];
  standardizedLocations?: string[];
  postedTs: number;
  department?: string;
  workLocationOption?: string;
};

const MELI_QUERIES = ["software", "developer", "desenvolvedor", "engineer", "junior", "trainee"];

export async function fetchMercadoLivreJobs(): Promise<UnifiedJob[]> {
  return cached("meli", async () => {
    const pages = MELI_QUERIES.flatMap((query) =>
      [0, 10, 20].map((start) => ({ query, start })),
    );
    const results = await mapLimit(pages, 4, async ({ query, start }) => {
      const params = new URLSearchParams({
        domain: "mercadolibre.com",
        query,
        location: "Brazil",
        start: String(start),
        num: "10",
      });
      const res = await fetchWithTimeout(
        `https://mercadolibre.eightfold.ai/api/pcsx/search?${params}`,
        { headers: { ...UA, Accept: "application/json" } },
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: { positions?: EightfoldPosition[] } };
      return data.data?.positions ?? [];
    });

    const byId = new Map<number, EightfoldPosition>();
    for (const page of results) for (const p of page) byId.set(p.id, p);

    return [...byId.values()].map((p) => ({
      id: `meli-${p.id}`,
      source: "Site da empresa" as const,
      title: p.name,
      company: "Mercado Livre / Mercado Pago",
      url: `https://mercadolibre.eightfold.ai/careers/job/${p.id}`,
      location: (p.standardizedLocations?.length ? p.standardizedLocations : p.locations).join("; "),
      tags: [p.department ?? ""].filter(Boolean),
      publishedAt: new Date(p.postedTs * 1000).toISOString(),
      workplace: p.workLocationOption === "remote" ? ("remote" as const) : ("onsite" as const),
    }));
  });
}

type GupyJob = {
  id: number;
  name: string;
  description?: string;
  careerPageName?: string;
  type?: string;
  publishedDate: string;
  workplaceType?: string;
  city?: string;
  state?: string;
  jobUrl: string;
};

const GUPY_TERMS = [
  "desenvolvedor",
  "desenvolvedora",
  "developer",
  "programador",
  "software",
  "full stack",
  "front-end",
  "back-end",
  "trainee",
  "analista de sistemas",
  "analista de desenvolvimento",
  "power platform",
];

/** Gupy career pages whose display name is a slogan rather than the company. */
const GUPY_COMPANY_NAMES: Record<string, string> = {
  vemproitau: "Itaú Unibanco",
  internationalexperienceitau: "Itaú Unibanco",
  ambev: "Ambev",
  localiza: "Localiza",
  fcamara: "FCamara",
  vagasstefanini: "Stefanini",
  stone: "Stone",
};

const EXCLUDED_GUPY_TYPES = new Set([
  "vacancy_type_internship",
  "vacancy_type_apprentice",
  "vacancy_type_talent_pool",
]);

function gupyCompanyName(job: GupyJob): string {
  const sub = job.jobUrl.match(/^https?:\/\/([^.]+)\.gupy\.io/)?.[1] ?? "";
  if (GUPY_COMPANY_NAMES[sub]) return GUPY_COMPANY_NAMES[sub];
  const name = (job.careerPageName ?? "").trim();
  const looksLikeSlogan =
    !name || name.length > 35 || /[#!]|^(venha|vem|seja|junte|trabalhe|carreiras|fa[cç]a)/i.test(name);
  if (!looksLikeSlogan) return name;
  return sub ? sub.charAt(0).toUpperCase() + sub.slice(1) : "Empresa (Gupy)";
}

export async function fetchGupyJobs(
  searchTerms?: string[],
  includeInternships = false,
): Promise<UnifiedJob[]> {
  const terms = searchTerms?.length ? searchTerms.slice(0, 12) : GUPY_TERMS;
  const cacheKey = `gupy:${includeInternships ? "i:" : ""}${terms.join("|").slice(0, 240)}`;
  return cached(cacheKey, async () => {
    const pages = terms.flatMap((term) => [0, 100, 200].map((offset) => ({ term, offset })));
    const results = await mapLimit(pages, 5, async ({ term, offset }) => {
      const params = new URLSearchParams({ jobName: term, limit: "100", offset: String(offset) });
      const res = await fetchWithTimeout(`https://portal.gupy.io/api/job-search/jobs?${params}`, {
        headers: { ...UA, Accept: "application/json" },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: GupyJob[] };
      return data.data ?? [];
    });

    const byId = new Map<number, GupyJob>();
    for (const page of results) for (const j of page) byId.set(j.id, j);

    const excludedTypes = includeInternships
      ? new Set(["vacancy_type_talent_pool"])
      : EXCLUDED_GUPY_TYPES;

    return [...byId.values()]
      .filter((j) => !excludedTypes.has(j.type ?? ""))
      .map((j) => ({
        id: `gupy-${j.id}`,
        source: "Gupy" as const,
        title: j.name,
        company: gupyCompanyName(j),
        url: j.jobUrl.split("?")[0],
        location: [j.city, j.state].filter(Boolean).join(", "),
        tags:
          j.type === "vacancy_type_trainee"
            ? ["trainee"]
            : j.type === "vacancy_type_internship" || j.type === "vacancy_type_apprentice"
              ? ["estágio"]
              : [],
        publishedAt: j.publishedDate,
        description: j.description?.slice(0, 3000),
        workplace: j.workplaceType === "remote" ? ("remote" as const) : ("onsite" as const),
      }));
  });
}

export async function fetchCompanyBoardJobs(): Promise<UnifiedJob[]> {
  return cached("company-boards", async () => {
    const boards = [
      ...Object.entries(GREENHOUSE_COMPANIES).map(([t, n]) => () => fetchGreenhouseBoard(t, n)),
      ...Object.entries(LEVER_COMPANIES).map(([t, n]) => () => fetchLeverBoard(t, n)),
    ];
    const results = await mapLimit(boards, 6, (load) => load());
    return results.flat();
  });
}

export async function fetchAllCompanySiteJobs(
  searchTerms?: string[],
  includeInternships = false,
): Promise<UnifiedJob[]> {
  const results = await Promise.allSettled([
    fetchGupyJobs(searchTerms, includeInternships),
    fetchCompanyBoardJobs(),
    fetchMercadoLivreJobs(),
  ]);
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export const MONITORED_COMPANIES = [
  "Itaú (Gupy)",
  "Mercado Livre / Mercado Pago",
  ...Object.values(GREENHOUSE_COMPANIES),
  ...Object.values(LEVER_COMPANIES),
  "+ milhares de empresas na Gupy (Ambev, Localiza, Stefanini…)",
];
