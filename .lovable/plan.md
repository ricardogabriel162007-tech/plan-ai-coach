## Redesign: Holy Gainz — Navegação principal + Comunidade + Mensagens

Vou estruturar a app pós-login em torno de 3 secções (Plano, Comunidade, Mensagens), com nav inferior em mobile e sidebar em desktop. Mantenho o design system atual (gold/fire, dark, shadcn/ui, logo).

### 1. Layout principal (`/_app`)
- Novo route layout `src/routes/_app.tsx` (pathless) que envolve as 3 secções com `<Outlet />` + nav.
- Mover `workout-plan.tsx` → `_app.plano.tsx` (rota `/plano`) e redirecionar `/workout-plan` para manter compatibilidade.
- Componente `AppNav`:
  - **Mobile (< md):** bottom bar fixa, 3 ícones com label, item ativo a gold (preenchido).
  - **Desktop (≥ md):** sidebar vertical à esquerda com logo + 3 itens.
- Ícones lucide:
  - Plano → `Dumbbell` (filled via `fill-current` quando ativo)
  - Comunidade → `Users` (idem)
  - Mensagens → `MessageCircle` por defeito; quando ativo, mesmo ícone com `fill-current` para parecer preenchido.
- Login redireciona para `/plano` em vez de `/workout-plan`.

### 2. Comunidade (`/comunidade`)
Ficheiros:
- `src/routes/_app.comunidade.tsx` — feed
- `src/routes/_app.comunidade.$postId.tsx` — detalhe
- `src/lib/community-mock.ts` — mock data (posts + respostas + utilizadores)
- `src/components/community/PostCard.tsx`, `CreatePostDialog.tsx`, `HashtagFilter.tsx`

Feed:
- Header com título "Comunidade" + botão `+ Criar Tópico` (gradiente gold) que abre `Dialog` com título + textarea + Publicar (adiciona ao estado mock local).
- Faixa horizontal scroll com hashtags (#pernas, #nutrição, #motivação, #iniciantes…) — clicar filtra a lista.
- Lista de cards estilo Reddit: à esquerda coluna de upvote (seta cima + contador, otimista no estado local); à direita avatar+username, hashtags, título destacado, preview, rodapé com `MessageSquare` + nº respostas e timestamp relativo (`há 2 horas` via util simples).
- Card todo clicável → `/comunidade/:postId`.

Detalhe:
- Post completo no topo (mesmo cartão expandido).
- Lista de respostas (avatar, nome, timestamp, texto).
- Form no fundo (textarea + botão Responder) que adiciona à lista mock em memória.

### 3. Mensagens (`/mensagens`)
Ficheiros:
- `src/routes/_app.mensagens.tsx` — lista + chat
- `src/lib/messages-mock.ts` — conversas mock
- `src/components/messages/ConversationList.tsx`, `ChatView.tsx`, `MessageBubble.tsx`

Layout responsivo (sem subrota; estado interno):
- **Desktop:** split — coluna esquerda (320px) com lista de conversas, coluna direita com chat ativo.
- **Mobile:** mostra só a lista; ao tocar numa conversa mostra só o chat com botão `←` para voltar.
- Lista: avatar, nome, preview da última mensagem (truncado), timestamp; item ativo realçado a gold.
- Chat:
  - Header com avatar+nome do interlocutor.
  - Área scrollável com balões: mensagens próprias à direita com `bg-primary text-primary-foreground rounded-2xl`, do outro à esquerda com `bg-card border rounded-2xl`. Timestamp pequeno por baixo.
  - Footer: `Input` + botão `Send` (gold). Enter envia; adiciona à conversa em memória.

### 4. Detalhes técnicos
- Tudo client-side, mock data em módulos `src/lib/*-mock.ts` com `useState` por página (sem persistência, sem Supabase).
- Helper `timeAgo(date)` em `src/lib/time.ts` (pt-PT: "agora", "há X min", "há X h", "há X d").
- Proteção: `_app.tsx` verifica `useAuth`; se sem sessão → `/auth`.
- Sem alterações ao schema, sem migrations, sem novas dependências.

### Estrutura final de rotas
```text
/                     landing (público)
/auth                 login
/onboarding           onboarding
/_app                 layout com nav (protegido)
  /plano              (era /workout-plan)
  /comunidade
  /comunidade/:postId
  /mensagens
```

Confirma que posso prosseguir — em particular: (a) renomear `/workout-plan` para `/plano` está OK? (b) ícones de Plano e Comunidade também devem ficar "preenchidos" quando ativos, certo?