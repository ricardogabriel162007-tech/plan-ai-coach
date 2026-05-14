import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, ArrowUp, ArrowDown, Loader2, Send, MoreVertical, CheckCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { avatarColor, initial } from "@/lib/avatar";
import { supabase } from "@/integrations/supabase/client";
import {
  getPost, listReplies, listVotes, castVote, createReply, deleteReply,
  markBestAnswer, unmarkBestAnswer, summarizeVotes,
  type PostRow, type ReplyRow, type VoteRow,
} from "@/lib/community-api";
import { toast } from "sonner";

export const Route = createFileRoute("/comunidade/$postId")({
  head: () => ({ meta: [{ title: "Tópico — Holy Gainz" }] }),
  component: PostDetailPage,
});

function PostDetailPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { postId } = Route.useParams();

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const [post, setPost] = useState<PostRow | null>(null);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [confirmDeleteReply, setConfirmDeleteReply] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [p, rs] = await Promise.all([getPost(postId), listReplies(postId)]);
      setPost(p);
      setReplies(rs);
      const ids = [postId, ...rs.map((r) => r.id)];
      const vs = await listVotes(ids);
      setVotes(vs);
    } finally {
      setPageLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!user) return;
    refresh();
    const ch = supabase
      .channel(`post_${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_replies", filter: `post_id=eq.${postId}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_posts", filter: `id=eq.${postId}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_votes" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, postId, refresh]);

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
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

  const isPostAuthor = user?.id === post.author_id;
  const postScore = summarizeVotes(votes, post.id, user?.id ?? null);

  const onVotePost = async (vt: "up" | "down") => {
    try { await castVote(post.id, "post", vt); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const onVoteReply = async (id: string, vt: "up" | "down") => {
    try { await castVote(id, "reply", vt); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const submitReply = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await createReply(post.id, reply.trim());
      setReply("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally { setBusy(false); }
  };

  const onDeleteReply = async () => {
    if (!confirmDeleteReply) return;
    try { await deleteReply(confirmDeleteReply); toast.success("Resposta apagada"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setConfirmDeleteReply(null); }
  };

  const onToggleBest = async (r: ReplyRow) => {
    try {
      if (r.is_best_answer) await unmarkBestAnswer(r.id);
      else await markBestAnswer(post.id, r.id);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  // Sort: best answer first, then chronological
  const sortedReplies = [...replies].sort((a, b) => {
    if (a.is_best_answer !== b.is_best_answer) return a.is_best_answer ? -1 : 1;
    return +new Date(a.created_at) - +new Date(b.created_at);
  });

  const username = post.author?.username ?? "—";

  return (
    <AppShell>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/40 px-5 sm:px-8 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Link to="/comunidade" className="w-9 h-9 rounded-lg border border-border hover:border-primary hover:text-primary flex items-center justify-center transition-smooth">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm font-semibold text-muted-foreground">Tópico</span>
        </div>
      </header>

      <main className="px-5 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <article className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className={cn("w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold text-foreground", avatarColor(username))}>
                {initial(username)}
              </span>
              <span className="font-medium text-foreground/90">{username}</span>
              <span>·</span>
              <span>{timeAgo(post.created_at)}</span>
              {post.type === "duvida" && (
                <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  <HelpCircle className="w-3 h-3" /> Dúvida
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{post.title}</h1>
            {post.content && <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {post.tags.map((h) => <span key={h} className="text-[11px] font-semibold text-primary">#{h}</span>)}
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => onVotePost("up")}
                  className={cn("inline-flex items-center justify-center w-8 h-8 rounded-md border transition-smooth",
                    postScore.myVote === "up" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-primary hover:border-primary/40")}
                ><ArrowUp className="w-4 h-4" strokeWidth={2.5} /></button>
                <span className={cn("text-sm font-bold tabular-nums w-8 text-center",
                  postScore.myVote === "up" ? "text-primary" : postScore.myVote === "down" ? "text-destructive" : "text-muted-foreground")}>
                  {postScore.score}
                </span>
                <button
                  onClick={() => onVotePost("down")}
                  className={cn("inline-flex items-center justify-center w-8 h-8 rounded-md border transition-smooth",
                    postScore.myVote === "down" ? "bg-destructive text-destructive-foreground border-destructive" : "border-border text-muted-foreground hover:text-destructive hover:border-destructive/40")}
                ><ArrowDown className="w-4 h-4" strokeWidth={2.5} /></button>
              </div>
            </div>
          </article>

          <h2 className="mt-8 mb-3 text-xs uppercase tracking-widest text-primary font-bold">
            Respostas ({replies.length})
          </h2>
          <div className="space-y-3">
            {sortedReplies.map((r) => {
              const rScore = summarizeVotes(votes, r.id, user?.id ?? null);
              const rUser = r.author?.username ?? "—";
              const mine = user?.id === r.author_id;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-lg border p-4 relative",
                    r.is_best_answer ? "bg-emerald-500/5 border-emerald-500/40" : "bg-card border-border",
                  )}
                >
                  {r.is_best_answer && (
                    <div className="flex items-center gap-1.5 mb-2 text-emerald-500 text-xs font-bold">
                      <CheckCircle className="w-4 h-4" /> Melhor resposta
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                    <span className={cn("w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold text-foreground", avatarColor(rUser))}>
                      {initial(rUser)}
                    </span>
                    <span className="font-medium text-foreground/90">{rUser}</span>
                    <span>·</span>
                    <span>{timeAgo(r.created_at)}</span>
                    {mine && (
                      <div className="ml-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-7 h-7 rounded-md hover:bg-background/60 flex items-center justify-center text-muted-foreground"><MoreVertical className="w-4 h-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setConfirmDeleteReply(r.id)} className="text-destructive">Apagar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                  <div className="mt-3 flex items-center gap-1">
                    <button
                      onClick={() => onVoteReply(r.id, "up")}
                      className={cn("inline-flex items-center justify-center w-7 h-7 rounded-md border transition-smooth",
                        rScore.myVote === "up" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-primary hover:border-primary/40")}
                    ><ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                    <span className={cn("text-xs font-bold tabular-nums w-6 text-center",
                      rScore.myVote === "up" ? "text-primary" : rScore.myVote === "down" ? "text-destructive" : "text-muted-foreground")}>
                      {rScore.score}
                    </span>
                    <button
                      onClick={() => onVoteReply(r.id, "down")}
                      className={cn("inline-flex items-center justify-center w-7 h-7 rounded-md border transition-smooth",
                        rScore.myVote === "down" ? "bg-destructive text-destructive-foreground border-destructive" : "border-border text-muted-foreground hover:text-destructive hover:border-destructive/40")}
                    ><ArrowDown className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                    {isPostAuthor && post.type === "duvida" && (
                      <button
                        onClick={() => onToggleBest(r)}
                        className={cn("ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold transition-smooth",
                          r.is_best_answer
                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
                            : "border-border text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500")}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {r.is_best_answer ? "Marcada" : "Melhor resposta"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {replies.length === 0 && <p className="text-sm text-muted-foreground italic">Sê o primeiro a responder.</p>}
          </div>

          <div className="mt-6 rounded-xl bg-card border border-border p-4">
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escreve a tua resposta..." rows={3} className="bg-background resize-none mb-3" />
            <div className="flex justify-end">
              <Button onClick={submitReply} disabled={!reply.trim() || busy} className="bg-gradient-fire text-primary-foreground">
                {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                Responder
              </Button>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={!!confirmDeleteReply} onOpenChange={(o) => !o && setConfirmDeleteReply(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar resposta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteReply} className="bg-destructive text-destructive-foreground">Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
