import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, Dumbbell, Target, Calendar } from "lucide-react";
import logo from "@/assets/holygains-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Holy Gainz — Plano de Treino com IA" },
      { name: "description", content: "Treina mais inteligente com um plano gerado por IA, adaptado a ti." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/workout-plan" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 pt-6 pb-4 border-b border-border/40">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <img src={logo} alt="Holy Gainz" className="w-9 h-9 rounded-lg object-contain" />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Holy</div>
            <div className="text-base font-bold text-gradient-gold -mt-0.5">Gainz</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Gerado por IA · Personalizado para ti
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5">
            O teu plano de treino,{" "}
            <span className="text-gradient-gold">feito à medida</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Responde a algumas perguntas e a IA cria um plano semanal completo, com séries, repetições e técnica para cada exercício.
          </p>
          <Link to="/auth">
            <Button className="h-13 px-8 bg-gradient-fire text-primary-foreground hover:opacity-90 shadow-gold font-semibold text-base">
              <Sparkles className="w-4 h-4 mr-2" />
              Começar agora
            </Button>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">
            {[
              { icon: Target, title: "Objetivos teus", desc: "Massa, força, perda de peso, calistenia…" },
              { icon: Calendar, title: "Adaptado", desc: "Ao teu nível e disponibilidade" },
              { icon: Dumbbell, title: "Editável", desc: "Substitui exercícios à vontade" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-card border border-border p-5 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="font-semibold mb-1">{f.title}</div>
                <div className="text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
