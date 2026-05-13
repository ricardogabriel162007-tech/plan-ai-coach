import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowUp, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { initialPosts, type CommunityPost, type CommunityReply } from "@/lib/community-mock";

export const Route = createFileRoute("/comunidade/$postId")({
  head: () => ({ meta: [{ title: "Tópico — Holy Gainz" }] }),
  component: PostDetailPage,
});

function PostDetailPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { postId } = Route.useParams();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const [post, setPost] = useState<CommunityPost | null>(
    () => initialPosts.find((p) => p.id === postId) ?? null,
  );
  const [voted, setVoted] = useState(false);
  const [reply, setReply] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="px-5 py-16 max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-2">Tópico não encontrado</h2>
          <Link to="/comunidade" className="text-primary hover:underline">Voltar à comunidade</Link>
        </div>
      </AppShell>
    );
  }

  const upvote = () => {
    setPost({ ...post, upvotes: post.upvotes + (voted ? -1 : 1) });
    setVoted(!voted);
  };

  const submitReply = () => {
    if (!reply.trim()) return;
    const r: CommunityReply = {
      id: `r${Date.now()}`,
      author: user?.email?.split("@")[0] ?? "tu",
      avatarColor: "bg-primary/40",
      content: reply.trim(),
      createdAt: Date.now(),
    };
    setPost({ ...post, replies: [...post.replies, r] });
    setReply("");
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/40 px-5 sm:px-8 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Link
            to="/comunidade"
            className="w-9 h-9 rounded-lg border border-border hover:border-primary hover:text-primary flex items-center justify-center transition-smooth"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm font-semibold text-muted-foreground">Tópico</span>
        </div>
      </header>

      <main className="px-5 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <article className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className={cn("w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold text-foreground", post.avatarColor)}>
                {post.author[0].toUpperCase()}
              </span>
              <span className="font-medium text-foreground/90">{post.author}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{post.title}</h1>
            {post.content && (
              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {post.hashtags.map((h) => (
                <span key={h} className="text-[11px] font-semibold text-primary">#{h}</span>
              ))}
              <button
                onClick={upvote}
                className={cn(
                  "ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold transition-smooth",
                  voted
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-primary hover:border-primary/40",
                )}
              >
                <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                {post.upvotes}
              </button>
            </div>
          </article>

          <h2 className="mt-8 mb-3 text-xs uppercase tracking-widest text-primary font-bold">
            Respostas ({post.replies.length})
          </h2>
          <div className="space-y-3">
            {post.replies.map((r) => (
              <div key={r.id} className="rounded-lg bg-card border border-border p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                  <span className={cn("w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold text-foreground", r.avatarColor)}>
                    {r.author[0].toUpperCase()}
                  </span>
                  <span className="font-medium text-foreground/90">{r.author}</span>
                  <span>·</span>
                  <span>{timeAgo(r.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
              </div>
            ))}
            {post.replies.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Sê o primeiro a responder.</p>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-card border border-border p-4">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Escreve a tua resposta..."
              rows={3}
              className="bg-background resize-none mb-3"
            />
            <div className="flex justify-end">
              <Button onClick={submitReply} disabled={!reply.trim()} className="bg-gradient-fire text-primary-foreground">
                <Send className="w-4 h-4 mr-1.5" />
                Responder
              </Button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
