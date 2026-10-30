import { formatNumber } from "@/lib/format";

type Day = { day: string; clicks: number };

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

// Gráfico de barras simples em HTML/CSS: leve, acessível e sem biblioteca.
export function ClicksChart({ days }: { days: Day[] }) {
  const max = Math.max(1, ...days.map((d) => Number(d.clicks)));
  const total = days.reduce((sum, d) => sum + Number(d.clicks), 0);

  return (
    <figure>
      <div className="flex h-40 items-end gap-1 sm:gap-1.5" aria-hidden>
        {days.map((d) => {
          const value = Number(d.clicks);
          const date = new Date(`${d.day}T00:00:00Z`);
          return (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={`w-full rounded-t-md ${value ? "bg-brand" : "bg-ink/8"}`}
                style={{ height: value ? `${Math.max(6, (value / max) * 100)}%` : "4px" }}
              />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block">
                {dayMonth.format(date)}: {value}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink/50" aria-hidden>
        <span>{days[0] ? dayMonth.format(new Date(`${days[0].day}T00:00:00Z`)) : ""}</span>
        <span>Hoje</span>
      </div>
      <figcaption className="sr-only">
        {formatNumber(total)} cliques nos últimos {days.length} dias.{" "}
        {days.map((d) => `${weekday.format(new Date(`${d.day}T00:00:00Z`))} ${dayMonth.format(new Date(`${d.day}T00:00:00Z`))}: ${d.clicks}`).join("; ")}
      </figcaption>
    </figure>
  );
}
