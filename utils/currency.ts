export function formatCHF(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  const safe = Number.isFinite(n) ? (n as number) : 0;
  const sign = safe < 0 ? "−" : "";
  const abs = Math.abs(safe);
  const [int, dec] = abs.toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${sign}CHF ${grouped}.${dec}`;
}

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}
