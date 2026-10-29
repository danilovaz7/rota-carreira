# Central de Emprego

Painel para acelerar sua busca de emprego no **LinkedIn** (e complementar com vagas remotas), sem depender de automação arriscada que pode bloquear sua conta.

## O que faz

- **Para você** — busca automática de links no LinkedIn BR, nos sites de carreira das empresas (Gupy, que inclui Itaú; Greenhouse: Nubank, Inter, C6, XP, BTG, Stone…; Lever: CI&T, Neon; Mercado Livre/Mercado Pago) e em APIs remotas. Filtra estágio, limita presencial a SP/Santos e região, e ranqueia trainee/júnior pelo seu currículo.
- **Perfil de busca** — keywords, skills e resumo para links e textos.
- **Links prontos** — buscas LinkedIn (Remoto + Easy Apply, vagas recentes, etc.), Google Jobs e Indeed BR.
- **Achar vagas** — portais BR (Gupy, Programathor, GeekHunter, Revelo, Trampos, etc.) + agregador **Remotive + Remote OK + Arbeitnow**.
- **Preparar candidatura** — match simples com a descrição, checklist Easy Apply, mensagens para copiar.
- **Rastreador** — salva URLs, status (salva → aplicada → entrevista…) e meta diária.

## O que não faz (de propósito)

Não clica em “Candidatar-se” no LinkedIn por você. Isso exige sua sessão, quebra com CAPTCHA e viola os termos da plataforma. O fluxo é: **achar mais vagas aqui → aplicar no LinkedIn → registrar aqui**.

Use o **chat do Cursor** colando link + descrição da vaga para personalizar currículo/resumo com o agente.

## Rodar localmente

```bash
npm install
npm run dev -- -p 43123
```

Abra [http://localhost:43123](http://localhost:43123).

## Dados

Por padrão, perfil e candidaturas ficam no **localStorage** de cada aparelho.

### Celular + PC no mesmo link

Na aba **Perfil → Celular e PC sempre iguais**, ative o **sync automático** uma vez em cada aparelho (mesmo código + PIN). Depois disso o app sincroniza sozinho:

- ao abrir o site e ao voltar para a aba;
- a cada 45 s com a aba aberta;
- ~1,5 s depois de qualquer mudança (Já enviei, salvar vaga, editar perfil) e ao sair da aba.

O indicador no topo mostra o status (“Na nuvem · agora”). Se os dois aparelhos mudaram ao mesmo tempo, as listas são unidas e uma vaga marcada como enviada nunca volta a “salva”. Os dados são criptografados no navegador (AES-GCM com código + PIN); o servidor só guarda texto ilegível. PIN errado nunca sobrescreve a nuvem.

**Backend:** [Upstash Redis](https://upstash.com) (grátis). Na Vercel: projeto → **Storage** → conectar Upstash Redis → Redeploy. São aceitas as variáveis `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` ou `KV_REST_API_URL`/`KV_REST_API_TOKEN`. Em `npm run dev` sem essas variáveis, o sync usa um arquivo local (`.data/sync-dev.json`) para testes.

Sem nuvem, ainda dá para usar **copiar/colar backup** (seção recolhida no mesmo painel).
