import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown, MessageSquare, Plus, Loader2, MoreVertical, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { avatarColor, initial } from "@/lib/avatar";
import { supabase } from "@/integrations/supabase/client";
import {
  listPosts, listVotes, countReplies, castVote, createPost, updatePost, deletePost,
  summarizeVotes, type PostRow, type PostType, type VoteRow,
} from "@/lib/community-api";
import { toast } from "sonner";

export const Route = createFileRoute("/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade — Holy Gainz" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!authLoading && !user) navigate({ to: "/auth" }); }, [authLoading, user, navigate]);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [activeTag, setActiveTag] = useState("todos");
  const [loading, setLoading] = useState(true);

  // create/edit modal
  const [openCreate, setOpenCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("discussao");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const ps = await listPosts();
      setPosts(ps);
      const ids = ps.map((p) => p.id);
      const [vs, rc] = await Promise.all([listVotes(ids), countReplies(ids)]);
      setVotes(vs);
      setReplyCounts(rc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro a carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh();
    const ch = supabase
      .channel("forum_posts_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_posts" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_replies" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_votes" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refresh]);

  const allTags = useMemo(() => {
    const s = new Set<string>(["todos"]);
    posts.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [posts]);

  const filtered = useMemo(
    () => (activeTag === "todos" ? posts : posts.filter((p) => p.tags.includes(activeTag))),
    [posts, activeTag],
  );

  const openCreateNew = () => {
    setEditingId(null);
    setTitle(""); setContent(""); setType("discussao"); setTagsInput("");
    setOpenCreate(true);
  };

  const openEdit = (p: PostRow) => {
    setEditingId(p.id);
    setTitle(p.title); setContent(p.content); setType(p.type);
    setTagsInput(p.tags.join(", "));
    setOpenCreate(true);
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Preenche título e descrição.");
      return;
    }
    const tags = tagsInput.split(/[,\s#]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    setSubmitting(true);
    try {
      if (editingId) {
        await updatePost(editingId, { title: title.trim(), content: content.trim(), type, tags });
        toast.success("Tópico atualizado");
      } else {
        await createPost({ title: title.trim(), content: content.trim(), type, tags });
        toast.success("Tópico publicado");
      }
      setOpenCreate(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  };

  const onVote = async (id: string, vt: "up" | "down") => {
    try {
      await castVote(id, "post", vt);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro a votar");
    }
  };

  const onDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deletePost(confirmDelete);
      toast.success("Tópico apagado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setConfirmDelete(null);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/40 px-5 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Comunidade</h1>
            <p className="text-xs text-muted-foreground">Partilha, pergunta, evolui.</p>
          </div>
          <Button onClick={openCreateNew} className="bg-gradient-fire text-primary-foreground shadow-gold font-semibold">
            <Plus className="w-4 h-4 mr-1" />
            Criar Tópico
          </Button>
        </div>
        <div className="max-w-3xl mx-auto mt-4 flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth border",
                activeTag === t
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30",
              )}
            >#{t}</button>
          ))}
        </div>
      </header>

      <main className="px-5 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              Nenhum tópico em #{activeTag}.
            </div>
          ) : (
            filtered.map((p) => {
              const { score, myVote } = summarizeVotes(votes, p.id, user?.id ?? null);
              return (
                <PostCard
                  key={p.id}
                  post={p}
                  score={score}
                  myVote={myVote}
                  replies={replyCounts[p.id] ?? 0}
                  isMine={user?.id === p.author_id}
                  onUp={() => onVote(p.id, "up")}
                  onDown={() => onVote(p.id, "down")}
                  onEdit={() => openEdit(p)}
                  onDelete={() => setConfirmDelete(p.id)}
                />
              );
            })
          )}
        </div>
      </main>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar tópico" : "Criar tópico"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={type} onValueChange={(v) => setType(v as PostType)}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="discussao">Discussão</SelectItem>
                <SelectItem value="duvida">Dúvida</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
            <Textarea placeholder="Descreve a tua pergunta ou partilha..." value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="bg-background resize-none" />
            <Input placeholder="Hashtags (ex: pernas, hipertrofia)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="bg-background" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={submitting} className="bg-gradient-fire text-primary-foreground">
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editingId ? "Guardar" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar tópico?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível. Todas as respostas associadas também serão eliminadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function PostCard({
  post, score, myVote, replies, isMine, onUp, onDown, onEdit, onDelete,
}: {
  post: PostRow; score: number; myVote: "up" | "down" | null; replies: number;
  isMine: boolean; onUp: () => void; onDown: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const username = post.author?.username ?? "—";
  return (
    <div className="rounded-xl bg-card border border-border hover:border-primary/40 transition-smooth flex overflow-hidden">
      <div className="flex flex-col items-center gap-1 p-3 bg-background/40 border-r border-border/60">
        <button
          onClick={(e) => { e.preventDefault(); onUp(); }}
          className={cn("w-7 h-7 rounded-md flex items-center justify-center transition-smooth border",
            myVote === "up" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-primary hover:border-primary/40")}
          aria-label="Voto positivo"
        ><ArrowUp className="w-4 h-4" strokeWidth={2.5} /></button>
        <span className={cn("text-xs font-bold tabular-nums",
          myVote === "up" ? "text-primary" : myVote === "down" ? "text-destructive" : "text-muted-foreground")}>
          {score}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); onDown(); }}
          className={cn("w-7 h-7 rounded-md flex items-center justify-center transition-smooth border",
            myVote === "down" ? "bg-destructive text-destructive-foreground border-destructive" : "border-border text-muted-foreground hover:text-destructive hover:border-destructive/40")}
          aria-label="Voto negativo"
        ><ArrowDown className="w-4 h-4" strokeWidth={2.5} /></button>
      </div>
      <Link to="/comunidade/$postId" params={{ postId: post.id }} className="flex-1 p-4 min-w-0 relative">
        {isMine && (
          <div className="absolute top-2 right-2" onClick={(e) => e.preventDefault()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 rounded-md hover:bg-background/60 flex items-center justify-center text-muted-foreground" aria-label="Opções">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">Apagar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <span className={cn("w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold text-foreground", avatarColor(username))}>
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
        <h3 className="font-bold text-base sm:text-lg leading-snug pr-7">{post.title}</h3>
        {post.content && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{post.content}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {post.tags.map((h) => (
            <span key={h} className="text-[11px] font-semibold text-primary">#{h}</span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />{replies}
          </span>
        </div>
      </Link>
    </div>
  );
}
