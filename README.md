# Central de Emprego

Painel para acelerar sua busca de emprego no **LinkedIn** (e complementar com vagas remotas), sem depender de automação arriscada que pode bloquear sua conta.

## O que faz

- **Perfil de busca** — keywords, skills e resumo para links e textos.
- **Links prontos** — buscas LinkedIn (Remoto + Easy Apply, vagas recentes, etc.), Google Jobs e Indeed BR.
- **Vagas remotas** — lista filtrada via API pública da [Remotive](https://remotive.com) (sempre abra o link original).
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

Tudo fica no `localStorage` do navegador (sem login, sem servidor de banco).
