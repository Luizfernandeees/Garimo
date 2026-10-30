import { BagIcon } from "@/components/brand/BagIcon";

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-panel)] bg-cream px-6 py-14 text-center">
      <BagIcon rays={false} className="size-14 text-brand" />
      <h2 className="mt-5 max-w-md font-display text-xl font-bold tracking-tight">{title}</h2>
      {children ? <div className="mt-2 max-w-md text-[15px] leading-relaxed text-ink/70">{children}</div> : null}
    </div>
  );
}
