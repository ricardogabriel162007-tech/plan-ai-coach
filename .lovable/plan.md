## Plano — Holy Gainz: Persistência Supabase para Comunidade & Mensagens

### 1. Migração de base de dados

Numa única migração:
- **profiles**: `id uuid PK references auth.users(id) on delete cascade`, `username text unique not null`, `avatar_url text`, `created_at`. Trigger `handle_new_user_profile` em `auth.users` que insere com `username = NEW.email`. (A tabela `public.profiles` atual usa `user_id` separado e não tem `username` — vou criar uma tabela `public.profiles` nova com a estrutura pedida; como o utilizador pediu explicitamente "id (uuid, FK auth.users... primary key)", vou **dropar a actual `profiles`** e recriar. Workout plan e onboarding usam `user_id` directo de `auth.users` em outras tabelas, não dependem da PK de profiles.)
- **forum_posts**, **forum_replies**, **forum_votes**, **messages** com RLS conforme spec.
- Realtime: `alter publication supabase_realtime add table` para `forum_posts`, `forum_replies`, `messages` + `replica identity full`.
- Função `has_voted` e índices úteis.

**Aviso**: a tabela `profiles` actual contém dados de onboarding (age, weight, sex, days_per_week, etc.). Vou **manter esses campos** na recriação para não partir o onboarding — só ajusto a PK e adiciono `username` + `avatar_url`. Trigger `handle_new_user` actualizado para inserir `id = NEW.id` e `username = NEW.email`.

### 2. Helpers de cliente

- `src/lib/community-api.ts`: `listPosts`, `getPost`, `createPost`, `updatePost`, `deletePost`, `listReplies`, `createReply`, `updateReply`, `deleteReply`, `markBestAnswer`, `vote(targetId, targetType, voteType)` (toggle/swap), `getVoteCounts`, `getMyVote`. Tudo via `supabase` client.
- `src/lib/messages-api.ts`: `listConversations(userId)`, `listMessages(a,b)`, `sendMessage`, `searchProfiles`.
- `src/lib/profiles-api.ts`: `getMyProfile`, `searchProfiles(query)`.

### 3. Comunidade

- `src/routes/comunidade.tsx`: substituir mock por `useQuery` + realtime channel em `forum_posts`. Modal de criação ganha campo **Tipo** (Discussão/Dúvida) via Select. Cards mostram net votes (calculados via subquery/agregado client-side). Botões up/down (`ArrowUp`/`ArrowDown`) com toggle. Menu `MoreVertical` (DropdownMenu) nos posts do autor: Editar (reabre modal pré-preenchido) / Apagar (AlertDialog).
- `src/routes/comunidade.$postId.tsx`: query do post + replies (realtime em `forum_replies` filtrado por `post_id`). Replies mostram menu se for autor. Se `post.type = 'duvida'` e viewer = autor do post, cada reply tem botão `CheckCircle` para marcar best answer (única). Best answer aparece no topo com destaque verde.

### 4. Mensagens

- `src/routes/mensagens.tsx`: substituir mock. Lista de conversas = agregado de `messages` onde user é sender ou receiver, agrupado por outro participante (computado client-side). Botão `PenSquare` no topo abre Dialog com Input de pesquisa que chama `searchProfiles`. Selecção abre chat (sem duplicar — usa o other-user-id como conversation key). Realtime subscription em `messages` filtrado por `receiver_id=eq.<me>` para receber novas e por `sender_id` para sincronizar ecos.

### 5. Detalhes técnicos

- Voto: lógica server-side é só upsert/delete. Cálculo de score: client busca todos votos do post (count up - count down) — para escala pequena, ok. Posso usar uma view `forum_post_scores` para optimizar mais tarde; **vou começar com fetch directo** (`select target_id, vote_type` para os ids visíveis).
- Best answer: ao marcar, `update forum_replies set is_best_answer=false where post_id=X` e depois `set true where id=reply_id`.
- Realtime: 1 channel por página, cleanup no unmount.
- Authenticação: todas páginas já redirecionam para `/auth` se não houver session.

### 6. Não muda

Design system, navegação, biblioteca, workout plan, onboarding.

---

**Próximo passo**: vou correr a migração SQL primeiro (precisa aprovação tua). Depois implemento o código.
