import { supabase } from "@/integrations/supabase/client";

export interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface ConversationSummary {
  otherId: string;
  otherUsername: string;
  lastMessage: MessageRow;
  unread: number;
}

export async function listMyMessages(myId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function listMessagesBetween(myId: string, otherId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`,
    )
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(receiverId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase
    .from("messages")
    .insert({ sender_id: user.id, receiver_id: receiverId, content });
  if (error) throw error;
}

export async function getProfilesByIds(ids: string[]): Promise<ProfileRow[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export async function searchProfiles(query: string, excludeId: string): Promise<ProfileRow[]> {
  let q = supabase.from("profiles").select("id, username, avatar_url").neq("id", excludeId).limit(20);
  if (query.trim()) q = q.ilike("username", `%${query.trim()}%`);
  const { data, error } = await q.order("username");
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export function buildConversations(messages: MessageRow[], myId: string, profiles: Map<string, ProfileRow>): ConversationSummary[] {
  const byOther = new Map<string, MessageRow[]>();
  for (const m of messages) {
    const other = m.sender_id === myId ? m.receiver_id : m.sender_id;
    const arr = byOther.get(other) ?? [];
    arr.push(m);
    byOther.set(other, arr);
  }
  const result: ConversationSummary[] = [];
  for (const [otherId, msgs] of byOther.entries()) {
    msgs.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const last = msgs[msgs.length - 1];
    const unread = msgs.filter((m) => m.receiver_id === myId && !m.read).length;
    result.push({
      otherId,
      otherUsername: profiles.get(otherId)?.username ?? "—",
      lastMessage: last,
      unread,
    });
  }
  result.sort((a, b) => +new Date(b.lastMessage.created_at) - +new Date(a.lastMessage.created_at));
  return result;
}
