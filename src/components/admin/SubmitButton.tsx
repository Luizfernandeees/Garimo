"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "dark" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-brand text-ink hover:bg-brand-hover",
    dark: "bg-ink text-white hover:bg-ink/85",
    ghost: "text-ink/70 hover:bg-ink/5 hover:text-ink",
  }[variant];
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${styles} ${className}`}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
