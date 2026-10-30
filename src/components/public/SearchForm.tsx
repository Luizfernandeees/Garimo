import { Search } from "lucide-react";

type SearchFormProps = {
  defaultValue?: string;
  size?: "md" | "lg";
  /** Mantém o filtro de categoria ao refazer a busca. */
  category?: string;
  id?: string;
};

// Formulário GET simples: funciona sem JavaScript e gera URLs
// compartilháveis como /busca?q=fone.
export function SearchForm({ defaultValue, size = "md", category, id = "busca" }: SearchFormProps) {
  const lg = size === "lg";
  return (
    <form action="/busca" method="get" role="search" className="w-full">
      <label htmlFor={id} className="sr-only">
        Buscar produtos
      </label>
      <div
        className={`flex items-center rounded-full border border-ink/15 bg-white transition-colors focus-within:border-ink/40 ${
          lg ? "p-1.5 pl-5" : "p-1 pl-4"
        }`}
      >
        <Search className={`shrink-0 text-ink/45 ${lg ? "size-5" : "size-4"}`} aria-hidden />
        <input
          id={id}
          name="q"
          type="search"
          defaultValue={defaultValue}
          maxLength={80}
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Buscar produtos"
          className={`min-w-0 flex-1 bg-transparent px-3 text-ink placeholder:text-ink/45 focus:outline-none ${
            lg ? "py-2.5 text-base" : "py-1.5 text-[15px]"
          }`}
        />
        {category ? <input type="hidden" name="categoria" value={category} /> : null}
        <button
          type="submit"
          className={`shrink-0 rounded-full bg-brand font-semibold text-ink transition-colors hover:bg-brand-hover ${
            lg ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
          }`}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
