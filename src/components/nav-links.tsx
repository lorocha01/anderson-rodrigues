"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // O item mais específico que casa com a rota atual fica ativo.
  const active = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
            item.href === active ? "bg-primary text-white" : "text-muted hover:bg-sand-deep hover:text-ink"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
