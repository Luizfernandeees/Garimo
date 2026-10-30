"use client";

import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import type { CategoryState } from "./actions";

const input =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] focus:border-ink/50 focus:outline-none aria-[invalid=true]:border-red-600";

export function CategoryForm({
  action,
  initial,
  submitLabel,
  idPrefix,
}: {
  action: (state: CategoryState, formData: FormData) => Promise<CategoryState>;
  initial?: { name: string; description: string | null; sort_order: number };
  submitLabel: string;
  idPrefix: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const e = state.fieldErrors ?? {};

  // No cadastro, limpa o formulário depois de criar.
  useEffect(() => {
    if (state.status === "success" && !initial) formRef.current?.reset();
  }, [state, initial]);

  return (
    <form ref={formRef} action={formAction} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_6rem]">
      <div>
        <label htmlFor={`${idPrefix}-name`} className="mb-1 block text-sm font-medium">
          Nome
        </label>
        <input id={`${idPrefix}-name`} name="name" defaultValue={initial?.name} maxLength={60} aria-invalid={e.name ? true : undefined} className={input} />
        {e.name ? <p className="mt-1 text-sm text-red-700">{e.name}</p> : null}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-description`} className="mb-1 block text-sm font-medium">
          Descrição <span className="font-normal text-ink/50">(opcional)</span>
        </label>
        <input
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={initial?.description ?? ""}
          maxLength={300}
          aria-invalid={e.description ? true : undefined}
          className={input}
        />
        {e.description ? <p className="mt-1 text-sm text-red-700">{e.description}</p> : null}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-order`} className="mb-1 block text-sm font-medium">
          Ordem
        </label>
        <input
          id={`${idPrefix}-order`}
          name="sort_order"
          type="number"
          min={0}
          max={999}
          inputMode="numeric"
          defaultValue={initial?.sort_order ?? 0}
          aria-invalid={e.sort_order ? true : undefined}
          className={input}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <SubmitButton pendingLabel="Salvando…" variant={initial ? "dark" : "primary"}>
          {submitLabel}
        </SubmitButton>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-700" : "text-leaf"}`}>
          {state.message}
        </p>
      </div>
    </form>
  );
}

export function ConfirmDelete({ action, id, name }: { action: (fd: FormData) => Promise<void>; id: string; name: string }) {
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!confirm(`Excluir a categoria “${name}”?`)) ev.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="ghost" pendingLabel="Excluindo…" className="text-red-700">
        Excluir
      </SubmitButton>
    </form>
  );
}
