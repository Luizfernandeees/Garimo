import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Link href="/" aria-label="GARIMO, página inicial">
        <Logo />
      </Link>
      <h1 className="mt-10 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-ink/70">
        O endereço pode ter mudado, ou o produto saiu da vitrine. Os outros achados continuam na página inicial.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-brand px-6 py-3 font-semibold text-ink transition-colors hover:bg-brand-hover"
      >
        Ir para a página inicial
      </Link>
    </main>
  );
}
