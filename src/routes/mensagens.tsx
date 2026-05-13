import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { initialConversations, type Conversation, type ChatMessage } from "@/lib/messages-mock";

export const Route = createFileRoute("/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens — Holy Gainz" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, activeId]);

  const send = () => {
    if (!draft.trim() || !active) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      fromMe: true,
      text: draft.trim(),
      createdAt: Date.now(),
    };
    setConversations((cur) =>
      cur.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, msg] } : c)),
    );
    setDraft("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="md:flex md:h-screen">
        {/* Conversation list */}
        <aside
          className={cn(
            "md:w-80 md:border-r md:border-border/40 md:h-screen md:flex md:flex-col",
            active ? "hidden md:flex" : "flex flex-col",
          )}
        >
          <div className="px-5 py-4 border-b border-border/40">
            <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
            <p className="text-xs text-muted-foreground">As tuas conversas</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex gap-3 items-center border-b border-border/30 transition-smooth",
                    isActive ? "bg-primary/10" : "hover:bg-card",
                  )}
                >
                  <span className={cn("w-11 h-11 rounded-full grid place-items-center text-sm font-bold shrink-0", c.avatarColor)}>
                    {c.name[0].toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("font-semibold text-sm truncate", isActive && "text-primary")}>
                        {c.name}
                      </span>
                      {last && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeAgo(last.createdAt)}
                        </span>
                      )}
                    </div>
                    {last && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {last.fromMe ? "Tu: " : ""}
                        {last.text}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat */}
        <section
          className={cn(
            "md:flex-1 md:h-screen md:flex md:flex-col",
            active ? "flex flex-col h-[calc(100vh-5rem)] md:h-screen" : "hidden md:flex",
          )}
        >
          {active ? (
            <>
              <header className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="md:hidden w-9 h-9 rounded-lg border border-border hover:border-primary flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className={cn("w-9 h-9 rounded-full grid place-items-center text-sm font-bold", active.avatarColor)}>
                  {active.name[0].toUpperCase()}
                </span>
                <div>
                  <div className="font-semibold text-sm">{active.name}</div>
                  <div className="text-[10px] text-muted-foreground">Online</div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
                {active.messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-snug shadow-sm",
                        m.fromMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border rounded-bl-sm",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <div className={cn("text-[10px] mt-1", m.fromMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {timeAgo(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <footer className="px-3 py-3 border-t border-border/40 flex items-center gap-2 bg-background">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Escreve uma mensagem..."
                  className="bg-card border-border"
                />
                <Button
                  onClick={send}
                  disabled={!draft.trim()}
                  size="icon"
                  className="bg-gradient-fire text-primary-foreground shrink-0"
                >
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
    </AppShell>
  );
}
