import Link from "next/link";

export function Section({
  title,
  note,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  note?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
  return (
    <section aria-labelledby={id} className="mt-14 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id={id} className="font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
            {title}
          </h2>
          {note ? <p className="mt-1 text-sm text-ink/60">{note}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="shrink-0 text-sm font-semibold text-brand-deep underline-offset-4 hover:underline">
            {hrefLabel ?? "Ver todos"}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
