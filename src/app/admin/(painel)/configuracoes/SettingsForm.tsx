"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { saveSettings, type SettingsState } from "./actions";

type Values = {
  hero_title: string;
  hero_subtitle: string;
  whatsapp_channel_url: string | null;
  instagram_url: string | null;
};

const input =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-[15px] focus:border-ink/50 focus:outline-none aria-[invalid=true]:border-red-600";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="mt-1.5 text-sm text-ink/55">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SettingsForm({ values }: { values: Values }) {
  const [state, action] = useActionState<SettingsState, FormData>(saveSettings, {});
  const e = state.fieldErrors ?? {};
  const a11y = (id: keyof Values) => ({
    id,
    name: id,
    "aria-invalid": e[id] ? true : undefined,
    "aria-describedby": e[id] ? `${id}-erro` : `${id}-dica`,
  });

  return (
    <form action={action} className="space-y-8">
      <fieldset className="min-w-0 space-y-5 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
        <legend className="px-1 font-display text-lg font-semibold">Banner da página inicial</legend>
        <Field id="hero_title" label="Título" hint="Até 90 caracteres." error={e.hero_title}>
          <input {...a11y("hero_title")} defaultValue={values.hero_title} maxLength={90} required className={input} />
        </Field>
        <Field id="hero_subtitle" label="Texto de apoio" hint="Até 220 caracteres." error={e.hero_subtitle}>
          <textarea
            {...a11y("hero_subtitle")}
            defaultValue={values.hero_subtitle}
            maxLength={220}
            rows={3}
            required
            className={`${input} resize-y`}
          />
        </Field>
      </fieldset>

      <fieldset className="min-w-0 space-y-5 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
        <legend className="px-1 font-display text-lg font-semibold">Redes</legend>
        <Field
          id="whatsapp_channel_url"
          label="Link do Canal do WhatsApp"
          hint="Os botões do canal só aparecem no site quando este link estiver preenchido."
          error={e.whatsapp_channel_url}
        >
          <input
            {...a11y("whatsapp_channel_url")}
            type="url"
            inputMode="url"
            placeholder="https://whatsapp.com/channel/…"
            defaultValue={values.whatsapp_channel_url ?? ""}
            className={input}
          />
        </Field>
        <Field id="instagram_url" label="Link do Instagram" hint="Aparece no rodapé do site." error={e.instagram_url}>
          <input
            {...a11y("instagram_url")}
            type="url"
            inputMode="url"
            placeholder="https://instagram.com/garimo"
            defaultValue={values.instagram_url ?? ""}
            className={input}
          />
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Salvando…">Salvar configurações</SubmitButton>
        <p aria-live="polite" className="text-sm">
          {state.status === "success" ? (
            <span className="inline-flex items-center gap-1.5 text-leaf">
              <CheckCircle2 className="size-4" aria-hidden /> {state.message}
            </span>
          ) : state.status === "error" ? (
            <span className="text-red-700">{state.message}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
