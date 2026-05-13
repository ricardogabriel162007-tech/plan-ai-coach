import { Link, useRouterState } from "@tanstack/react-router";
import { Dumbbell, Users, MessageCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/holygains-logo.png";
import { supabase } from "@/integrations/supabase/client";

type Item = {
  to: "/workout-plan" | "/comunidade" | "/mensagens";
  label: string;
  icon: typeof Dumbbell;
};

const items: Item[] = [
  { to: "/workout-plan", label: "Plano", icon: Dumbbell },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/mensagens", label: "Mensagens", icon: MessageCircle },
];

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    to === "/workout-plan"
      ? pathname.startsWith("/workout-plan")
      : pathname.startsWith(to);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-border/40 bg-background/80 backdrop-blur z-30">
        <Link to="/workout-plan" className="flex items-center gap-2 px-5 py-5 border-b border-border/40">
          <img src={logo} alt="Holy Gainz" className="w-9 h-9 rounded-lg object-contain" />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Holy</div>
            <div className="text-base font-bold text-gradient-gold -mt-0.5">Gainz</div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const active = isActive(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                  active
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-card",
                )}
              >
                <Icon
                  className={cn("w-5 h-5", active && "fill-current")}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-card transition-smooth"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {items.map((it) => {
            const active = isActive(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-smooth",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("w-6 h-6", active && "fill-current")}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/** Wraps page content with proper padding for the nav. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:pl-60 pb-20 md:pb-0">
      <AppNav />
      {children}
    </div>
  );
}
