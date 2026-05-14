import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Send, PenSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { avatarColor, initial } from "@/lib/avatar";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyMessages, listMessagesBetween, sendMessage, getProfilesByIds,
  searchProfiles, buildConversations,
  type MessageRow, type ProfileRow, type ConversationSummary,
} from "@/lib/messages-api";
import { toast } from "sonner";

export const Route = createFileRoute("/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens — Holy Gainz" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const [allMessages, setAllMessages] = useState<MessageRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());
  const [activeOther, setActiveOther] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load all my messages + profiles
  const refresh = useCallback(async () => {
    if (!user) return;
    const msgs = await listMyMessages(user.id);
    setAllMessages(msgs);
    const otherIds = Array.from(new Set(msgs.flatMap((m) => [m.sender_id, m.receiver_id]).filter((id) => id !== user.id)));
    const profs = await getProfilesByIds(otherIds);
    setProfiles(new Map(profs.map((p) => [p.id, p])));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    refresh();
    const ch = supabase
      .channel("messages_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as MessageRow;
        if (m.sender_id === user.id || m.receiver_id === user.id) refresh();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refresh]);

  // Load active conversation messages
  useEffect(() => {
    if (!user || !activeOther) { setActiveMessages([]); return; }
    listMessagesBetween(user.id, activeOther).then(setActiveMessages);
  }, [user, activeOther, allMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length, activeOther]);

  // Search profiles in new-message dialog
  useEffect(() => {
    if (!openNew || !user) return;
    const t = setTimeout(() => {
      searchProfiles(searchQ, user.id).then(setSearchResults).catch(() => setSearchResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [openNew, searchQ, user]);

  const conversations: ConversationSummary[] = useMemo(
    () => (user ? buildConversations(allMessages, user.id, profiles) : []),
    [allMessages, profiles, user],
  );

  const send = async () => {
    if (!draft.trim() || !activeOther || !user) return;
    const text = draft.trim();
    setDraft("");
    try {
      await sendMessage(activeOther, text);
      // Optimistic refresh handled by realtime + refresh
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro a enviar");
      setDraft(text);
    }
  };

  const startConversation = async (otherId: string, prof: ProfileRow) => {
    setProfiles((m) => { const n = new Map(m); n.set(prof.id, prof); return n; });
    setActiveOther(otherId);
    setOpenNew(false);
    setSearchQ("");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  const activeProfile = activeOther ? profiles.get(activeOther) : null;

  return (
    <AppShell>
      <div className="md:flex md:h-screen">
        {/* Conversation list */}
        <aside className={cn("md:w-80 md:border-r md:border-border/40 md:h-screen md:flex md:flex-col", activeOther ? "hidden md:flex" : "flex flex-col")}>
          <div className="px-5 py-4 border-b border-border/40 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
              <p className="text-xs text-muted-foreground">As tuas conversas</p>
            </div>
            <Button onClick={() => setOpenNew(true)} size="icon" className="bg-gradient-fire text-primary-foreground shrink-0" aria-label="Nova mensagem">
              <PenSquare className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">Sem conversas ainda. Toca em <PenSquare className="inline w-3.5 h-3.5" /> para começar.</p>
            )}
            {conversations.map((c) => {
              const isActive = c.otherId === activeOther;
              return (
                <button
                  key={c.otherId}
                  onClick={() => setActiveOther(c.otherId)}
                  className={cn("w-full text-left px-4 py-3 flex gap-3 items-center border-b border-border/30 transition-smooth",
                    isActive ? "bg-primary/10" : "hover:bg-card")}
                >
                  <span className={cn("w-11 h-11 rounded-full grid place-items-center text-sm font-bold shrink-0", avatarColor(c.otherUsername))}>
                    {initial(c.otherUsername)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("font-semibold text-sm truncate", isActive && "text-primary")}>{c.otherUsername}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.lastMessage.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.lastMessage.sender_id === user?.id ? "Tu: " : ""}{c.lastMessage.content}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">{c.unread}</span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat */}
        <section className={cn("md:flex-1 md:h-screen md:flex md:flex-col",
          activeOther ? "flex flex-col h-[calc(100vh-5rem)] md:h-screen" : "hidden md:flex")}>
          {activeOther && activeProfile ? (
            <>
              <header className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
                <button onClick={() => setActiveOther(null)} className="md:hidden w-9 h-9 rounded-lg border border-border hover:border-primary flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className={cn("w-9 h-9 rounded-full grid place-items-center text-sm font-bold", avatarColor(activeProfile.username))}>
                  {initial(activeProfile.username)}
                </span>
                <div>
                  <div className="font-semibold text-sm">{activeProfile.username}</div>
                  <div className="text-[10px] text-muted-foreground">Online</div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
                {activeMessages.map((m) => {
                  const fromMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-snug shadow-sm",
                        fromMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm")}>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <div className={cn("text-[10px] mt-1", fromMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {timeAgo(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activeMessages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground italic mt-12">Diz olá!</p>
                )}
              </div>

              <footer className="px-3 py-3 border-t border-border/40 flex items-center gap-2 bg-background">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Escreve uma mensagem..."
                  className="bg-card border-border"
                />
                <Button onClick={send} disabled={!draft.trim()} size="icon" className="bg-gradient-fire text-primary-foreground shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </footer>
            </>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground text-sm">
              Seleciona uma conversa para começar.
            </div>
          )}
        </section>
      </div>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Nova mensagem</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Pesquisa por username..."
              className="pl-9 bg-background"
            />
          </div>
          <div className="max-h-72 overflow-y-auto -mx-2">
            {searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum utilizador encontrado.</p>
            )}
            {searchResults.map((p) => (
              <button
                key={p.id}
                onClick={() => startConversation(p.id, p)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background transition-smooth"
              >
                <span className={cn("w-9 h-9 rounded-full grid place-items-center text-sm font-bold shrink-0", avatarColor(p.username))}>
                  {initial(p.username)}
                </span>
                <span className="font-semibold text-sm">{p.username}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
