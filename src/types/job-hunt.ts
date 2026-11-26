export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  /** Você tirou a vaga da lista (não interessa, já fechou, salário…). */
  | "dismissed";

/** Onde o "Para você" procura vagas. */
export type JobSourceToggles = {
  linkedin: boolean;
  gupy: boolean;
  /** Sites de carreira (Greenhouse, Lever, Mercado Livre). */
  companies: boolean;
  /** Sites internacionais de vagas remotas (Remotive, RemoteOK, Arbeitnow, Jobicy). */
  remoteBoards: boolean;
};

/** "tech" liga os filtros e atalhos de TI; "other" deixa a busca neutra para qualquer área. */
export type CareerArea = "tech" | "other";

export type JobProfile = {
  /** Área de atuação. Perfis antigos sem o campo são tratados como "tech". */
  careerArea: CareerArea;
  fullName: string;
  headline: string;
  location: string;
  /** Uma busca por item, separadas por vírgula ou por linha. */
  keywords: string;
  skills: string;
  /** Vagas com algum desses termos no título são descartadas. */
  excludeKeywords: string;
  yearsExperience: string;
  linkedInUrl: string;
  resumeSummary: string;
  dailyApplyGoal: number;
  /** Se true, estágio e programas de estagiário entram na aba Para você. */
  includeInternships: boolean;
  /** Se true, vagas pleno também entram (com nota menor). */
  includeMidLevel: boolean;
  /** Se true, vagas sênior, especialista, coordenação e gerência também entram. */
  includeSenior: boolean;
  acceptRemote: boolean;
  /** Presencial ou híbrido nas regiões marcadas abaixo. */
  acceptOnsite: boolean;
  regionBaixada: boolean;
  regionGreaterSP: boolean;
  /** Outras cidades aceitas para presencial/híbrido, separadas por vírgula. */
  extraCities: string;
  /** Vagas publicadas há mais dias que isso ficam de fora. */
  maxAgeDays: number;
  /** Encaixe mínimo (0–100) para a vaga aparecer. */
  minScore: number;
  /** Dá mais pontos para vagas no site da própria empresa (Gupy, páginas de carreira). */
  preferCompanySites: boolean;
  sources: JobSourceToggles;
};

export type Application = {
  id: string;
  company: string;
  title: string;
  url: string;
  source: string;
  status: ApplicationStatus;
  notes: string;
  jobDescription: string;
  createdAt: string;
  appliedAt?: string;
  /** Status antes de descartar, para o "Restaurar" devolver como estava. */
  dismissedFrom?: ApplicationStatus;
};

/** Modelos prontos para quem está começando: preenchem título, palavras-chave e skills. */
export type SearchPreset = {
  id: string;
  area: CareerArea;
  label: string;
  description: string;
  headline: string;
  keywords: string;
  skills: string;
};

export const SEARCH_PRESETS: SearchPreset[] = [
  {
    id: "dev",
    area: "tech",
    label: "Desenvolvimento",
    description: "Full stack, front-end e back-end",
    headline: "Desenvolvedor Full Stack",
    keywords:
      "desenvolvedor full stack júnior, desenvolvedor front-end júnior, desenvolvedor back-end júnior, desenvolvedor react júnior",
    skills: "JavaScript, TypeScript, React, Node.js, SQL, APIs REST, Git, HTML, CSS",
  },
  {
    id: "dados",
    area: "tech",
    label: "Dados e BI",
    description: "Análise de dados, Power BI e SQL",
    headline: "Analista de Dados",
    keywords: "analista de dados júnior, analista de bi júnior, power bi, business intelligence",
    skills: "Power BI, SQL, Excel, Python, DAX, Power Query",
  },
  {
    id: "design",
    area: "tech",
    label: "Design UI/UX",
    description: "Interfaces, produto e web design",
    headline: "Designer UI/UX",
    keywords: "designer ui ux júnior, product designer júnior, web designer, designer gráfico júnior",
    skills: "Figma, UI Design, UX, Photoshop, Illustrator, Design System",
  },
  {
    id: "automacao",
    area: "tech",
    label: "Power Platform",
    description: "Power Apps, Power Automate e RPA",
    headline: "Desenvolvedor Power Platform",
    keywords: "power platform, desenvolvedor power apps, power automate, rpa júnior",
    skills: "Power Apps, Power Automate, Power BI, SharePoint, Excel",
  },
  {
    id: "engenharia",
    area: "other",
    label: "Engenharia",
    description: "Química, produção, processos e qualidade",
    headline: "Engenheiro de Processos",
    keywords:
      "engenheiro júnior, engenheiro de processos júnior, engenheiro de produção júnior, engenheiro químico júnior, analista de qualidade júnior",
    skills: "Melhoria contínua, Lean, Controle de qualidade, ISO 9001, AutoCAD, Excel",
  },
  {
    id: "administrativo",
    area: "other",
    label: "Administrativo e Financeiro",
    description: "Assistente, analista financeiro, contábil",
    headline: "Assistente Administrativo",
    keywords:
      "assistente administrativo, analista financeiro júnior, assistente financeiro, analista contábil júnior, auxiliar administrativo",
    skills: "Excel, Contas a pagar, Contas a receber, Conciliação bancária, ERP, Pacote Office",
  },
  {
    id: "logistica",
    area: "other",
    label: "Logística e Comex",
    description: "Operações, porto, importação e exportação",
    headline: "Analista de Logística",
    keywords:
      "analista de logística júnior, assistente de logística, analista de comércio exterior júnior, assistente de importação, assistente de exportação",
    skills: "Comércio exterior, Desembaraço aduaneiro, Excel, SAP, Gestão de estoque, Inglês",
  },
  {
    id: "rh",
    area: "other",
    label: "Recursos Humanos",
    description: "Recrutamento, DP e treinamento",
    headline: "Analista de RH",
    keywords: "analista de rh júnior, assistente de rh, analista de recrutamento júnior, assistente de departamento pessoal",
    skills: "Recrutamento e seleção, Departamento pessoal, Folha de pagamento, Treinamento, Excel",
  },
  {
    id: "comercial",
    area: "other",
    label: "Vendas e Atendimento",
    description: "Comercial, SDR e sucesso do cliente",
    headline: "Executivo de Vendas",
    keywords: "vendedor, consultor de vendas, assistente comercial, sdr, customer success júnior, atendimento ao cliente",
    skills: "Negociação, Prospecção, CRM, Atendimento ao cliente, Pós-venda",
  },
  {
    id: "marketing",
    area: "other",
    label: "Marketing",
    description: "Digital, conteúdo e mídias sociais",
    headline: "Analista de Marketing",
    keywords: "analista de marketing júnior, assistente de marketing, analista de marketing digital, social media, redator",
    skills: "Marketing digital, Redes sociais, Google Ads, Meta Ads, SEO, Canva",
  },
];

export const DEFAULT_SOURCES: JobSourceToggles = {
  linkedin: true,
  gupy: true,
  companies: true,
  remoteBoards: true,
};

/** Perfil vazio: cada pessoa monta o seu na aba Perfil (o tutorial explica). */
export const DEFAULT_PROFILE: JobProfile = {
  careerArea: "tech",
  fullName: "",
  headline: "",
  location: "",
  keywords: "",
  skills: "",
  excludeKeywords: "",
  yearsExperience: "",
  linkedInUrl: "",
  resumeSummary: "",
  dailyApplyGoal: 5,
  includeInternships: false,
  includeMidLevel: false,
  includeSenior: false,
  acceptRemote: true,
  acceptOnsite: true,
  regionBaixada: false,
  regionGreaterSP: false,
  extraCities: "",
  maxAgeDays: 21,
  minScore: 30,
  preferCompanySites: true,
  sources: DEFAULT_SOURCES,
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Salva",
  applied: "Aplicada",
  interview: "Entrevista",
  offer: "Proposta",
  rejected: "Recusada",
  dismissed: "Descartada",
};
