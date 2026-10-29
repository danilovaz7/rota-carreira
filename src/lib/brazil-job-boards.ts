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

/** Portais onde devs BR costumam achar vaga (não só LinkedIn). */
export function buildBrazilJobBoardLinks(profile: JobProfile): JobBoardLink[] {
  const term =
    profile.keywords.trim() ||
    "desenvolvedor full stack react node júnior";
  const city = profile.location.includes("Santos")
    ? "Santos"
    : profile.location.split(",")[0]?.trim() || "São Paulo";

  return [
    {
      id: "gupy",
      name: "Gupy",
      description: "Muitas empresas BR (CLT e estágio). Filtre remoto + tecnologia.",
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
      href: `https://www.trampos.co/oportunidades?q=${q("desenvolvedor")}`,
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
      description: "Cultura fit + vagas de produto/tech.",
      href: `https://99jobs.com/vagas?q=${q("desenvolvedor software")}`,
      tags: ["BR"],
    },
    {
      id: "catho",
      name: "Catho",
      description: "Volume alto; use filtros de área TI.",
      href: `https://www.catho.com.br/buscar/vagas?q=${q("desenvolvedor software")}`,
      tags: ["volume"],
    },
    {
      id: "infojobs",
      name: "InfoJobs",
      description: "Tradicional; busque Full Stack + Santos/SP/remoto.",
      href: `https://www.infojobs.com.br/vagas-de-emprego.aspx?palabra=${q("desenvolvedor full stack")}`,
      tags: ["BR"],
    },
    {
      id: "glassdoor",
      name: "Glassdoor",
      description: "Vagas + salários reportados.",
      href: `https://www.glassdoor.com.br/Vaga/${q("desenvolvedor full stack")}-vagas-SRCH_KO0,24.htm`,
      tags: ["salário"],
    },
    {
      id: "lovemondays",
      name: "Love Mondays",
      description: "Reviews + vagas em tech.",
      href: `https://www.lovemondays.com.br/vagas?q=${q("desenvolvedor")}`,
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
}

export const SUGGESTED_SEARCHES_FOR_DANILO = [
  "desenvolvedor júnior full stack react",
  "estágio desenvolvimento sistemas santos",
  "power platform desenvolvedor",
  "node react typescript remoto brasil",
  "analista desenvolvimento júnior",
];
