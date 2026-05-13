import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowUp, MessageSquare, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { initialPosts, allHashtags, type CommunityPost } from "@/lib/community-mock";
import { toast } from "sonner";

export const Route = createFileRoute("/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade — Holy Gainz" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [activeTag, setActiveTag] = useState("todos");
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const filtered = useMemo(
    () => (activeTag === "todos" ? posts : posts.filter((p) => p.hashtags.includes(activeTag))),
    [posts, activeTag],
  );

  const upvote = (id: string) => {
    setPosts((cur) =>
      cur.map((p) =>
        p.id === id ? { ...p, upvotes: p.upvotes + (voted[id] ? -1 : 1) } : p,
      ),
    );
    setVoted((v) => ({ ...v, [id]: !v[id] }));
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Adiciona um título.");
      return;
    }
    const tags = tagsInput
      .split(/[,\s#]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const np: CommunityPost = {
      id: `p${Date.now()}`,
      author: user?.email?.split("@")[0] ?? "tu",
      avatarColor: "bg-primary/40",
      title: title.trim(),
      content: content.trim(),
      hashtags: tags.length ? tags : ["geral"],
      upvotes: 1,
      createdAt: Date.now(),
      replies: [],
    };
    setPosts((cur) => [np, ...cur]);
    setVoted((v) => ({ ...v, [np.id]: true }));
    setTitle("");
    setContent("");
    setTagsInput("");
    setOpenCreate(false);
    toast.success("Tópico publicado!");
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
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/40 px-5 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Comunidade</h1>
            <p className="text-xs text-muted-foreground">Partilha, pergunta, evolui.</p>
          </div>
          <Button onClick={() => setOpenCreate(true)} className="bg-gradient-fire text-primary-foreground shadow-gold font-semibold">
            <Plus className="w-4 h-4 mr-1" />
            Criar Tópico
          </Button>
        </div>
        <div className="max-w-3xl mx-auto mt-4 flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {allHashtags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth border",
                activeTag === t
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30",
              )}
            >
              #{t}
            </button>
          ))}
        </div>
      </header>

      <main className="px-5 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} voted={!!voted[p.id]} onVote={() => upvote(p.id)} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              Nenhum tópico em #{activeTag}.
            </div>
          )}
        </div>
      </main>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar tópico</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Título do tópico *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
            <Textarea
              placeholder="Descreve a tua pergunta ou partilha..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="bg-background resize-none"
            />
            <Input
              placeholder="Hashtags (ex: pernas, hipertrofia)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="bg-background"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button onClick={submit} className="bg-gradient-fire text-primary-foreground">
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function PostCard({ post, voted, onVote }: { post: CommunityPost; voted: boolean; onVote: () => void }) {
  return (
    <div className="rounded-xl bg-card border border-border hover:border-primary/40 transition-smooth flex overflow-hidden">
      <div className="flex flex-col items-center gap-1 p-3 bg-background/40 border-r border-border/60">
        <button
          onClick={(e) => {
            e.preventDefault();
            onVote();
          }}
          className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center transition-smooth border",
            voted
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-primary hover:border-primary/40",
          )}
          aria-label="Voto positivo"
        >
          <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <span className={cn("text-xs font-bold tabular-nums", voted ? "text-primary" : "text-muted-foreground")}>
          {post.upvotes}
        </span>
      </div>
      <Link
        to="/comunidade/$postId"
        params={{ postId: post.id }}
        className="flex-1 p-4 min-w-0"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <span className={cn("w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold text-foreground", post.avatarColor)}>
            {post.author[0].toUpperCase()}
          </span>
          <span className="font-medium text-foreground/90">{post.author}</span>
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>
        <h3 className="font-bold text-base sm:text-lg leading-snug">{post.title}</h3>
        {post.content && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{post.content}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {post.hashtags.map((h) => (
            <span key={h} className="text-[11px] font-semibold text-primary">
              #{h}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />
            {post.replies.length}
          </span>
        </div>
      </Link>
    </div>
  );
}
