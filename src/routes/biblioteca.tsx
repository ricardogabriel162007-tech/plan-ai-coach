import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Dumbbell, Building2, Activity, User } from "lucide-react";
import { AppShell } from "@/components/AppNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  exercises,
  muscleGroups,
  equipments,
  levels,
  type Exercise,
  type Equipment,
  type Level,
  type MuscleGroup,
} from "@/lib/exercises-mock";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Exercícios — Holy Gainz" },
      { name: "description", content: "Explora a biblioteca de exercícios da Holy Gainz: filtra por grupo muscular, equipamento e nível." },
    ],
  }),
  component: BibliotecaPage,
});

const equipmentIcon: Record<Equipment, typeof Dumbbell> = {
  "Ginásio Completo": Building2,
  "Halteres": Dumbbell,
  "Banda": Activity,
  "Peso Corporal": User,
};

function BibliotecaPage() {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "Todos">("Todos");
  const [eqFilters, setEqFilters] = useState<Equipment[]>([]);
  const [levelFilters, setLevelFilters] = useState<Level[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (activeGroup !== "Todos" && ex.muscleGroup !== activeGroup) return false;
      if (eqFilters.length && !eqFilters.includes(ex.equipment)) return false;
      if (levelFilters.length && !levelFilters.includes(ex.level)) return false;
      return true;
    });
  }, [query, activeGroup, eqFilters, levelFilters]);

  const advancedCount = eqFilters.length + levelFilters.length;

  const toggle = <T,>(arr: T[], v: T, set: (next: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <AppShell>
      <main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        <header className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-gold">Biblioteca</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pesquisa e descobre exercícios para o teu treino.
          </p>
        </header>

        {/* Search + advanced */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar exercício…"
              className="pl-9 h-11"
            />
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 gap-2 relative">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
                {advancedCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                    {advancedCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle>Filtros avançados</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Equipamento
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {equipments.map((eq) => {
                      const active = eqFilters.includes(eq);
                      const Icon = equipmentIcon[eq];
                      return (
                        <button
                          key={eq}
                          onClick={() => toggle(eqFilters, eq, setEqFilters)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-smooth",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Nível
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {levels.map((lv) => {
                      const active = levelFilters.includes(lv);
                      return (
                        <button
                          key={lv}
                          onClick={() => toggle(levelFilters, lv, setLevelFilters)}
                          className={cn(
                            "px-3 py-2 rounded-lg border text-sm transition-smooth",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {lv}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>

              <SheetFooter className="gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEqFilters([]);
                    setLevelFilters([]);
                  }}
                >
                  Limpar
                </Button>
                <Button onClick={() => setSheetOpen(false)}>Aplicar</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Muscle group chips */}
        <div className="-mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto mb-5">
          <div className="flex gap-2 w-max md:w-full md:flex-wrap pb-1">
            {(["Todos", ...muscleGroups] as const).map((g) => {
              const active = activeGroup === g;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap border transition-smooth",
                    active
                      ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Nenhum exercício encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((ex) => {
              const Icon = equipmentIcon[ex.equipment];
              return (
                <Card
                  key={ex.id}
                  onClick={() => setSelected(ex)}
                  className="group cursor-pointer p-4 hover:border-primary/50 hover:shadow-gold transition-smooth"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-11 h-11 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-smooth">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-tight mb-1.5 truncate">
                        {ex.name}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="default" className="text-[10px]">
                          {ex.muscleGroup}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {ex.level}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-md">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-gradient-gold">{selected.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 flex-wrap pt-2">
                    <Badge>{selected.muscleGroup}</Badge>
                    <Badge variant="secondary">{selected.equipment}</Badge>
                    <Badge variant="outline">{selected.level}</Badge>
                  </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-foreground/90 leading-relaxed">
                  {selected.description}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </AppShell>
  );
}
