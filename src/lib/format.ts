const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return brl.format(Number(value));
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

// Remove caracteres com significado especial nos filtros do PostgREST.
export function sanitizeSearch(input: string | undefined | null) {
  return (input ?? "")
    .replace(/[%_,()*\\:"'.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function pageParam(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 && n < 1000 ? n : 1;
}
