import { formatPrice } from "@/lib/format";

// Preço anterior e desconto aparecem SOMENTE quando o banco calculou
// discount_percent, ou seja, quando o preço anterior foi confirmado e é
// maior que o atual.
export function Price({
  current,
  previous,
  discount,
  size = "md",
}: {
  current: number | null;
  previous: number | null;
  discount: number | null;
  size?: "md" | "lg";
}) {
  const now = formatPrice(current);
  if (!now) return <p className="text-sm text-ink/60">Preço na Shopee</p>;
  const showPrevious = discount !== null && previous !== null;
  const lg = size === "lg";

  return (
    <div className={lg ? "space-y-1.5" : "space-y-0.5"}>
      {showPrevious ? (
        <p className={`text-ink/55 ${lg ? "text-base" : "text-xs"}`}>
          <span className="sr-only">Preço anterior: </span>
          <s>{formatPrice(previous)}</s>
        </p>
      ) : null}
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className={`font-display font-bold tracking-tight ${lg ? "text-4xl" : "text-lg"}`}>
          <span className="sr-only">Preço atual: </span>
          {now}
        </span>
        {showPrevious && lg ? (
          <span className="rounded-full bg-leaf px-2.5 py-1 text-sm font-semibold text-white">
            {discount}% mais barato
          </span>
        ) : null}
      </p>
    </div>
  );
}
