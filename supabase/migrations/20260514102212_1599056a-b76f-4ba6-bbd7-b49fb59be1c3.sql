
-- 1. Reestruturar profiles
-- Drop trigger existente para podermos alterar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Garantir que cada user_id é único antes de o tornar PK
DELETE FROM public.profiles a USING public.profiles b
WHERE a.ctid < b.ctid AND a.user_id = b.user_id;

-- Drop a coluna id antiga e usar user_id como id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE public.profiles DROP COLUMN id;
ALTER TABLE public.profiles RENAME COLUMN user_id TO id;
ALTER TABLE public.profiles ADD PRIMARY KEY (id);
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar username e avatar_url
ALTER TABLE public.profiles ADD COLUMN username text;
ALTER TABLE public.profiles ADD COLUMN avatar_url text;

-- Backfill username a partir de auth.users.email
UPDATE public.profiles p
SET username = COALESCE(u.email, 'user_' || substring(p.id::text, 1, 8))
FROM auth.users u
WHERE u.id = p.id AND p.username IS NULL;

-- Garantir username para órfãos
UPDATE public.profiles SET username = 'user_' || substring(id::text, 1, 8) WHERE username IS NULL;

ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX profiles_username_key ON public.profiles(username);

-- RLS profiles: ajustar políticas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Recriar handle_new_user com nova estrutura
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  attempt int := 0;
BEGIN
  base_username := COALESCE(NEW.email, 'user_' || substring(NEW.id::text, 1, 8));
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    attempt := attempt + 1;
    final_username := base_username || '_' || attempt;
  END LOOP;
  INSERT INTO public.profiles (id, username) VALUES (NEW.id, final_username);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. forum_posts
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'discussao',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX forum_posts_created_at_idx ON public.forum_posts(created_at DESC);
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read posts" ON public.forum_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create posts" ON public.forum_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author update posts" ON public.forum_posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Author delete posts" ON public.forum_posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TRIGGER forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. forum_replies
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_best_answer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX forum_replies_post_id_idx ON public.forum_replies(post_id);
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read replies" ON public.forum_replies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create replies" ON public.forum_replies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author or post-author update replies" ON public.forum_replies
  FOR UPDATE TO authenticated USING (
    auth.uid() = author_id
    OR auth.uid() = (SELECT author_id FROM public.forum_posts WHERE id = post_id)
  );
CREATE POLICY "Author delete replies" ON public.forum_replies
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- 4. forum_votes
CREATE TABLE public.forum_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL,
  target_type text NOT NULL,
  vote_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_id)
);
CREATE INDEX forum_votes_target_idx ON public.forum_votes(target_id);
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read votes" ON public.forum_votes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own votes" ON public.forum_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own votes" ON public.forum_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.forum_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_pair_idx ON public.messages(sender_id, receiver_id, created_at DESC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver mark read" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- 6. Realtime
ALTER TABLE public.forum_posts REPLICA IDENTITY FULL;
ALTER TABLE public.forum_replies REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
