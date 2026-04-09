# Epic 2 — Fluxo Core + Páginas Completas + Meta API

**Status:** Ready  
**Criado em:** 2026-04-07  
**Estimativa:** 8 stories

---

## Objetivo

Transformar o sistema de uma casca navegável em um produto funcional. A Fase 1 entregou autenticação, dashboards e estrutura. A Fase 2 entrega o **fluxo de trabalho real**: criar posts, enviar para aprovação, cliente aprova, sistema agenda e publica automaticamente no Instagram via Meta API.

---

## Contexto

### O que existe (Fase 1)
- Autenticação completa (Auth.js v5)
- Dashboards: Admin, Agency, Client
- Calendário de posts (visualização)
- Kanban de solicitações de arte (visualização)
- Mockup de feed Instagram
- Schema Prisma completo (Post, ArtRequest, Approval, Notification...)
- API de upload de arquivos (`/api/upload`)
- Webhook Meta + cron job de publicação (scaffolded)

### O que está quebrado/faltando
- Links da nav que levam a 404: `/agency/approvals`, `/client/approvals`, `/client/calendar`, `/client/art-requests`, `/admin/users`, `/admin/settings`
- Nenhum formulário de criação (post, solicitação de arte, cliente)
- Fluxo de aprovação sem tela
- Meta API sem configuração OAuth

---

## Stories

### Story 2.1 — Gestão de Posts (CRUD + Envio para Aprovação)
**Ator:** Employee/Admin  
**Páginas:**
- `/agency/posts/new` — formulário criar post (título, caption, hashtags, rede, data agendamento, upload mídia)
- `/agency/posts/[id]` — detalhe/editar post + mudar status

**Critérios de aceite:**
- [ ] Criar post com título, caption, hashtags, rede social, data/hora agendamento
- [ ] Upload de até 10 imagens/vídeos por post
- [ ] Botão "Enviar para aprovação" muda status DRAFT → PENDING_APPROVAL e cria registro em Approval
- [ ] Botão "+ Novo post" no calendário navega para formulário
- [ ] Validação de campos obrigatórios

---

### Story 2.2 — Fila de Aprovações (Agência)
**Ator:** Employee/Admin  
**Página:** `/agency/approvals`

**Critérios de aceite:**
- [ ] Lista todos os posts com status PENDING_APPROVAL dos clientes da agência
- [ ] Filtro por cliente
- [ ] Card do post mostra: título, cliente, rede social, data agendada, thumbnail da mídia
- [ ] Link para detalhe do post
- [ ] Contador de pendentes no dashboard já funciona (já existe)

---

### Story 2.3 — Fluxo de Aprovação (Cliente)
**Ator:** Client  
**Páginas:**
- `/client/approvals` — lista aprovações pendentes
- `/client/approvals/[id]` — detalhe: visualizar post, aprovar ou solicitar revisão com comentário

**Critérios de aceite:**
- [ ] Cliente vê posts aguardando sua aprovação
- [ ] Visualização completa: mídia, caption, hashtags, data agendada
- [ ] Botão "Aprovar" → status PENDING_APPROVAL → APPROVED → SCHEDULED (se tem data)
- [ ] Botão "Solicitar revisão" → abre textarea para comentário → status → PENDING_APPROVAL permanece, comentário salvo
- [ ] Notificação visual após ação

---

### Story 2.4 — Solicitações de Arte Completas
**Ator:** Employee/Admin + Client  
**Páginas:**
- `/agency/art-requests/[id]` — detalhe completo com briefing, anexos, entregáveis, revisões, mudança de status
- `/client/art-requests` — lista do cliente
- `/client/art-requests/new` — formulário de nova solicitação

**Critérios de aceite:**
- [ ] Detalhe mostra: briefing completo, tipo, prazo, prioridade, histórico de revisões
- [ ] Upload de anexos (referências visuais) pelo cliente
- [ ] Upload de entregáveis pela agência
- [ ] Mudança de status com comentário (timeline de atividade)
- [ ] Cliente pode criar nova solicitação via formulário
- [ ] Botão "Nova solicitação" no client dashboard funciona

---

### Story 2.5 — Calendário do Cliente
**Ator:** Client  
**Página:** `/client/calendar`

**Critérios de aceite:**
- [ ] Mesmo componente `CalendarView` da agência
- [ ] Exibe apenas posts do próprio cliente
- [ ] Filtra por rede social
- [ ] Navega entre meses

---

### Story 2.6 — Gestão de Clientes Completa
**Ator:** Admin  
**Páginas:**
- `/admin/clients/new` — formulário criar cliente
- `/admin/clients/[id]` — detalhe/editar cliente

**Critérios de aceite:**
- [ ] Criar cliente: nome, slug, instagram handle, cores da marca, fuso horário
- [ ] Editar dados do cliente
- [ ] Ativar/desativar cliente
- [ ] Ver posts e solicitações vinculadas ao cliente
- [ ] Botão "Novo cliente" na listagem funciona

---

### Story 2.7 — Gestão de Equipe e Configurações
**Ator:** Admin  
**Páginas:**
- `/admin/users` — listar e convidar usuários da agência
- `/admin/settings` — configurações: Meta App ID/Secret, SMTP

**Critérios de aceite:**
- [ ] Listar usuários com role e status
- [ ] Formulário de configuração da agência (Meta App ID, Meta App Secret, Webhook Secret)
- [ ] Salva configurações no model Agency no banco
- [ ] Campos sensíveis mascarados na UI

---

### Story 2.8 — Meta API: Publicação Automática no Instagram
**Ator:** Sistema (cron job)  
**Arquivos:** `src/app/api/cron/publish/route.ts`, `src/lib/meta.ts`

**Critérios de aceite:**
- [ ] Fluxo OAuth para conectar conta Instagram do cliente (salva `metaAccessToken` + `instagramAccountId`)
- [ ] Botão "Conectar Instagram" em `/admin/clients/[id]`
- [ ] Cron job publica posts com status SCHEDULED e `scheduledAt <= now()`
- [ ] Suporte a post simples (imagem) e carrossel
- [ ] Em caso de erro: status → FAILED, salva `errorMessage`
- [ ] Em caso de sucesso: status → PUBLISHED, salva `metaPostId` e `publishedAt`
- [ ] Proteção do endpoint cron com `CRON_SECRET`

---

## Ordem de implementação sugerida

```
2.1 Posts (CRUD) → 2.2 Aprovações Agência → 2.3 Aprovações Cliente
       ↓
2.4 Solicitações Arte → 2.5 Calendário Cliente
       ↓
2.6 Gestão Clientes → 2.7 Admin Settings
       ↓
2.8 Meta API (depende de 2.7 para tokens)
```

## Arquivos críticos a modificar/criar

| Story | Arquivos Novos | Arquivos Existentes |
|-------|---------------|---------------------|
| 2.1 | `/agency/posts/new/page.tsx`, `/agency/posts/[id]/page.tsx` | `calendar/page.tsx` (link), `lib/meta.ts` |
| 2.2 | `/agency/approvals/page.tsx` | — |
| 2.3 | `/client/approvals/page.tsx`, `/client/approvals/[id]/page.tsx` | — |
| 2.4 | `/agency/art-requests/[id]/page.tsx`, `/client/art-requests/page.tsx`, `/client/art-requests/new/page.tsx` | — |
| 2.5 | `/client/calendar/page.tsx` | `calendar-month-view.tsx` (reutilizar) |
| 2.6 | `/admin/clients/new/page.tsx`, `/admin/clients/[id]/page.tsx` | `clients/page.tsx` |
| 2.7 | `/admin/users/page.tsx`, `/admin/settings/page.tsx` | — |
| 2.8 | `/admin/clients/[id]/connect-instagram/page.tsx`, `api/cron/publish/route.ts` | `lib/meta.ts` |

## Dependências externas

- **Meta Graph API**: `POST /{ig-user-id}/media` + `POST /{ig-user-id}/media_publish`
- **Variáveis de ambiente adicionais**: `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_SECRET`, `CRON_SECRET`
