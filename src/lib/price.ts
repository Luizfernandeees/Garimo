// Converte "R$ 1.299,90", "1299,90" ou "1299.90" em 1299.9.
// Retorna null para vazio e NaN para texto inválido.
export function parsePrice(input: unknown): number | null {
  const raw = String(input ?? "").replace(/R\$|\s/g, "");
  if (!raw) return null;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Math.round(Number(normalized) * 100) / 100;
}

export function priceToInput(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return Number(value).toFixed(2).replace(".", ",");
}

export function discountPercent(current: number | null, previous: number | null, confirmed: boolean) {
  if (!confirmed || current === null || previous === null || Number.isNaN(current) || Number.isNaN(previous)) return null;
  if (previous <= current || previous <= 0) return null;
  return Math.round((1 - current / previous) * 100);
}
