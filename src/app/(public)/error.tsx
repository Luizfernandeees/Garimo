"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/public/EmptyState";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-10">
      <EmptyState title="Não foi possível carregar esta página">
        <p>Verifique sua conexão e tente de novo.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink/85"
        >
          Tentar de novo
        </button>
      </EmptyState>
    </div>
  );
}
