export function timeAgo(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  const sec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return "agora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `há ${day} d`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `há ${wk} sem`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `há ${mo} mes`;
  return `há ${Math.floor(day / 365)} ano`;
}
