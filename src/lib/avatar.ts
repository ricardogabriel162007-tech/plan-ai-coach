const COLORS = [
  "bg-orange-500/40",
  "bg-pink-500/40",
  "bg-emerald-500/40",
  "bg-blue-500/40",
  "bg-yellow-500/40",
  "bg-purple-500/40",
  "bg-red-500/40",
  "bg-cyan-500/40",
];

export function avatarColor(seed: string | null | undefined): string {
  if (!seed) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function initial(name: string | null | undefined): string {
  return (name?.trim()[0] ?? "?").toUpperCase();
}
