"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { SubmitButton } from "@/components/admin/SubmitButton";

const input =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-[15px] focus:border-ink/50 focus:outline-none aria-[invalid=true]:border-red-600";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(signIn, { error: initialError });

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          aria-invalid={Boolean(state.error) || undefined}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.error) || undefined}
          className={input}
        />
      </div>
      <SubmitButton pendingLabel="Entrando…" variant="dark" className="w-full py-3 text-base">
        Entrar no painel
      </SubmitButton>
    </form>
  );
}
