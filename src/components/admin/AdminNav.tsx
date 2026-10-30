"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Settings, Tags } from "lucide-react";

// Só aparecem aqui seções que já funcionam. Legendas entram na Fase 3.
const items = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";
  return (
    <nav aria-label="Seções do painel">
      <ul className={vertical ? "space-y-1" : "no-scrollbar flex gap-1 overflow-x-auto"}>
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
