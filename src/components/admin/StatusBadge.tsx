import type { ProductStatus } from "@/types/database";

export const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const STYLE: Record<ProductStatus, string> = {
  draft: "bg-ink/8 text-ink/75",
  published: "bg-leaf/12 text-leaf",
  archived: "bg-ink/5 text-ink/50",
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[status]}`}>
      <span className={`size-1.5 rounded-full ${status === "published" ? "bg-leaf" : "bg-current opacity-60"}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
