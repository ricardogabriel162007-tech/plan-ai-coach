import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/holygains-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Holy Gainz" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/onboarding" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/onboarding`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vindo.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sessão iniciada!");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/onboarding` });
      if (result.error) toast.error("Erro com Google");
    } catch {
      toast.error("Login com Google indisponível");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Holy Gainz" className="w-14 h-14 rounded-xl object-contain mb-3" />
          <h1 className="text-2xl font-bold">
            <span className="text-gradient-gold">Holy Gainz</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Cria a tua conta" : "Entra na tua conta"}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-card">
          <div>
            <Label className="text-sm">Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-input border-border mt-1.5"
            />
          </div>
          <div>
            <Label className="text-sm">Palavra-passe</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-input border-border mt-1.5"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full h-11 bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90 shadow-gold"
          >
            {busy ? "..." : mode === "signup" ? "Criar conta" : "Entrar"}
          </Button>

          <Button type="button" variant="outline" onClick={google} className="w-full h-11 border-border">
            Continuar com Google
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            {mode === "signup" ? "Já tens conta?" : "Sem conta?"}{" "}
            <button
              type="button"
              className="text-primary font-semibold"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
