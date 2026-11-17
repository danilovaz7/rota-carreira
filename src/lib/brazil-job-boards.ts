import { buildSearchTermsFromProfile, primaryKeyword } from "@/lib/jobs/profile-search-terms";
import type { JobProfile } from "@/types/job-hunt";

export type JobBoardLink = {
  id: string;
  name: string;
  description: string;
  href: string;
  tags: string[];
};

function q(text: string): string {
  return encodeURIComponent(text.trim());
}

/** Portais só de tecnologia: escondidos quando a área do perfil não é TI. */
const TECH_ONLY_BOARDS = new Set(["programathor", "geekhunter", "apinfo"]);

/** Portais de vagas no Brasil (não só LinkedIn), já com a busca do seu perfil. */
export function buildBrazilJobBoardLinks(profile: JobProfile): JobBoardLink[] {
  const tech = profile.careerArea !== "other";
  const term = primaryKeyword(profile) || (tech ? "desenvolvedor full stack júnior" : "trainee");
  const city = profile.location.includes("Santos")
    ? "Santos"
    : profile.location.split(",")[0]?.trim() || "São Paulo";

  const boards: JobBoardLink[] = [
    {
      id: "gupy",
      name: "Gupy",
      description: "Muitas empresas BR (CLT e estágio), de todas as áreas.",
      href: `https://portal.gupy.io/job-search/term=${q(term)}&location=${q(city)}`,
      tags: ["BR", "CLT"],
    },
    {
      id: "programathor",
      name: "Programathor",
      description: "Focado em dev; vagas júnior/pleno frequentes.",
      href: `https://programathor.com.br/jobs?search=${q("react node typescript")}`,
      tags: ["dev"],
    },
    {
      id: "geekhunter",
      name: "GeekHunter",
      description: "Tech recruiting; cadastro único para várias empresas.",
      href: `https://www.geekhunter.com.br/emprego?q=${q("full stack")}`,
      tags: ["tech"],
    },
    {
      id: "revelo",
      name: "Revelo",
      description: "Remoto para empresas BR e internacionais.",
      href: "https://www.revelo.com.br/jobs",
      tags: ["remoto"],
    },
    {
      id: "trampos",
      name: "Trampos.co",
      description: "Startups e digital; bom para júnior com portfólio.",
      href: `https://www.trampos.co/oportunidades?q=${q(term)}`,
      tags: ["startup"],
    },
    {
      id: "startupbase",
      name: "Startup Base",
      description: "Vagas em startups brasileiras.",
      href: "https://startupbase.com.br/vagas",
      tags: ["startup"],
    },
    {
      id: "99jobs",
      name: "99jobs",
      description: "Empresas que olham cultura e perfil, não só experiência.",
      href: `https://99jobs.com/vagas?q=${q(term)}`,
      tags: ["BR"],
    },
    {
      id: "catho",
      name: "Catho",
      description: "Volume alto; use os filtros de área e cidade.",
      href: `https://www.catho.com.br/buscar/vagas?q=${q(term)}`,
      tags: ["volume"],
    },
    {
      id: "infojobs",
      name: "InfoJobs",
      description: "Tradicional; combine o cargo com a sua cidade ou “remoto”.",
      href: `https://www.infojobs.com.br/vagas-de-emprego.aspx?palabra=${q(term)}`,
      tags: ["BR"],
    },
    {
      id: "glassdoor",
      name: "Glassdoor",
      description: "Vagas + salários reportados.",
      href: `https://www.glassdoor.com.br/Vaga/${q(term)}-vagas-SRCH_KO0,${term.length}.htm`,
      tags: ["salário"],
    },
    {
      id: "lovemondays",
      name: "Love Mondays",
      description: "Avaliações de empresas + vagas.",
      href: `https://www.lovemondays.com.br/vagas?q=${q(term)}`,
      tags: ["BR"],
    },
    {
      id: "apinfo",
      name: "APInfo",
      description: "Clássico de TI no Brasil; remoto e presencial.",
      href: "https://www.apinfo.com/apinfo/inc/site/index.asp",
      tags: ["TI"],
    },
  ];

  return tech ? boards : boards.filter((b) => !TECH_ONLY_BOARDS.has(b.id));
}

/** Buscas sugeridas a partir do perfil (as mesmas usadas no Para você). */
export function suggestedSearches(profile: JobProfile): string[] {
  return buildSearchTermsFromProfile(profile, 6);
}
