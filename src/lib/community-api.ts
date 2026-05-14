import { supabase } from "@/integrations/supabase/client";

export type PostType = "discussao" | "duvida";

export interface PostRow {
  id: string;
  author_id: string;
  title: string;
  content: string;
  type: PostType;
  tags: string[];
  created_at: string;
  updated_at: string;
  author: { username: string } | null;
}

export interface ReplyRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_best_answer: boolean;
  created_at: string;
  author: { username: string } | null;
}

export type VoteType = "up" | "down";

export interface VoteRow {
  target_id: string;
  vote_type: VoteType;
  user_id: string;
}

export async function listPosts(): Promise<PostRow[]> {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*, author:profiles!forum_posts_author_id_fkey(username)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PostRow[];
}

export async function getPost(id: string): Promise<PostRow | null> {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*, author:profiles!forum_posts_author_id_fkey(username)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as PostRow | null;
}

export async function listReplies(postId: string): Promise<ReplyRow[]> {
  const { data, error } = await supabase
    .from("forum_replies")
    .select("*, author:profiles!forum_replies_author_id_fkey(username)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReplyRow[];
}

export async function createPost(input: { title: string; content: string; type: PostType; tags: string[] }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("forum_posts")
    .insert({ ...input, author_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePost(id: string, input: { title: string; content: string; type: PostType; tags: string[] }) {
  const { error } = await supabase.from("forum_posts").update(input).eq("id", id);
  if (error) throw error;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("forum_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function createReply(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase
    .from("forum_replies")
    .insert({ post_id: postId, content, author_id: user.id });
  if (error) throw error;
}

export async function deleteReply(id: string) {
  const { error } = await supabase.from("forum_replies").delete().eq("id", id);
  if (error) throw error;
}

export async function markBestAnswer(postId: string, replyId: string) {
  const { error: e1 } = await supabase
    .from("forum_replies")
    .update({ is_best_answer: false })
    .eq("post_id", postId);
  if (e1) throw e1;
  const { error: e2 } = await supabase
    .from("forum_replies")
    .update({ is_best_answer: true })
    .eq("id", replyId);
  if (e2) throw e2;
}

export async function unmarkBestAnswer(replyId: string) {
  const { error } = await supabase
    .from("forum_replies")
    .update({ is_best_answer: false })
    .eq("id", replyId);
  if (error) throw error;
}

export async function listVotes(targetIds: string[]): Promise<VoteRow[]> {
  if (!targetIds.length) return [];
  const { data, error } = await supabase
    .from("forum_votes")
    .select("target_id, vote_type, user_id")
    .in("target_id", targetIds);
  if (error) throw error;
  return (data ?? []) as VoteRow[];
}

/** Toggle vote: same → remove, different → switch, none → insert */
export async function castVote(targetId: string, targetType: "post" | "reply", voteType: VoteType) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: existing } = await supabase
    .from("forum_votes")
    .select("id, vote_type")
    .eq("user_id", user.id)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing && existing.vote_type === voteType) {
    const { error } = await supabase.from("forum_votes").delete().eq("id", existing.id);
    if (error) throw error;
    return null;
  }
  if (existing) {
    const { error } = await supabase.from("forum_votes").update({ vote_type: voteType }).eq("id", existing.id);
    if (error) throw error;
    return voteType;
  }
  const { error } = await supabase
    .from("forum_votes")
    .insert({ user_id: user.id, target_id: targetId, target_type: targetType, vote_type: voteType });
  if (error) throw error;
  return voteType;
}

export function computeScore(votes: VoteRow[], targetId: string) {
  let score = 0;
  let myVote: VoteType | null = null;
  return { score, myVote, all: votes.filter(v => v.target_id === targetId) };
}

export function summarizeVotes(votes: VoteRow[], targetId: string, myUserId: string | null) {
  let score = 0;
  let myVote: VoteType | null = null;
  for (const v of votes) {
    if (v.target_id !== targetId) continue;
    if (v.vote_type === "up") score += 1;
    else if (v.vote_type === "down") score -= 1;
    if (myUserId && v.user_id === myUserId) myVote = v.vote_type;
  }
  return { score, myVote };
}

export async function countReplies(postIds: string[]): Promise<Record<string, number>> {
  if (!postIds.length) return {};
  const { data, error } = await supabase
    .from("forum_replies")
    .select("post_id")
    .in("post_id", postIds);
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const r of data ?? []) map[r.post_id] = (map[r.post_id] ?? 0) + 1;
  return map;
}
