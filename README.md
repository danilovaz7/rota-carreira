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

Na aba **Perfil → Usar no celular e no PC**:

1. **Copiar backup / Importar** — funciona em qualquer deploy (mande o texto para você no WhatsApp e cole no outro aparelho).
2. **Sync na nuvem (código + PIN)** — opcional; exige [Upstash Redis](https://upstash.com) na Vercel (`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`). O PIN criptografa os dados no navegador antes de enviar.
