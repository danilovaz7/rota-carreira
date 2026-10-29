import type { JobProfile } from "@/types/job-hunt";

export type SearchLink = {
  id: string;
  label: string;
  description: string;
  href: string;
};

function baseParams(profile: JobProfile): URLSearchParams {
  const p = new URLSearchParams();
  const kw = profile.keywords.trim() || profile.headline;
  p.set("keywords", kw);
  if (profile.location.trim()) {
    p.set("location", profile.location.trim());
  }
  p.set("sortBy", "DD");
  return p;
}

/** LinkedIn f_WT: 1=on-site, 2=remote, 3=hybrid */
export function buildLinkedInSearchLinks(profile: JobProfile): SearchLink[] {
  const recent = baseParams(profile);
  recent.set("f_TPR", "r604800");

  const remote = baseParams(profile);
  remote.set("f_WT", "2");

  const hybrid = baseParams(profile);
  hybrid.set("f_WT", "3");

  const easyApply = baseParams(profile);
  easyApply.set("f_AL", "true");

  const remoteEasy = baseParams(profile);
  remoteEasy.set("f_WT", "2");
  remoteEasy.set("f_AL", "true");

  const mk = (params: URLSearchParams) =>
    `https://www.linkedin.com/jobs/search/?${params.toString()}`;

  return [
    {
      id: "recent",
      label: "Vagas recentes (7 dias)",
      description: "Priorize o que foi publicado na última semana.",
      href: mk(recent),
    },
    {
      id: "remote-easy",
      label: "Remoto + Easy Apply",
      description: "Melhor combo para aplicar rápido no LinkedIn.",
      href: mk(remoteEasy),
    },
    {
      id: "easy",
      label: "Easy Apply",
      description: "Candidatura simplificada dentro do LinkedIn.",
      href: mk(easyApply),
    },
    {
      id: "remote",
      label: "Remoto",
      description: "Trabalho 100% remoto.",
      href: mk(remote),
    },
    {
      id: "hybrid",
      label: "Híbrido",
      description: "Presencial + remoto.",
      href: mk(hybrid),
    },
    {
      id: "all",
      label: "Todas (sem filtro extra)",
      description: "Busca ampla com suas palavras-chave.",
      href: mk(baseParams(profile)),
    },
  ];
}

export function buildGoogleJobsLink(profile: JobProfile): string {
  const q = encodeURIComponent(
    `${profile.keywords || profile.headline} ${profile.location}`.trim(),
  );
  return `https://www.google.com/search?q=${q}&ibp=htl;jobs`;
}

export function buildIndeedBrLink(profile: JobProfile): string {
  const q = encodeURIComponent(profile.keywords || profile.headline);
  const l = encodeURIComponent(profile.location || "Brasil");
  return `https://br.indeed.com/jobs?q=${q}&l=${l}`;
}
