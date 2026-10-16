"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui";
import { NavLinks } from "@/components/nav-links";
import { useDemo } from "./store";

export function DemoBanner() {
  const { reset } = useDemo();
  const router = useRouter();
  return (
    <div className="bg-lilac text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <span className="font-bold">Demonstração · dados fictícios</span>
        <span className="flex gap-4">
          <Link href="/demo" className="font-bold underline-offset-2 hover:underline">Trocar perfil</Link>
          <button
            className="font-bold underline-offset-2 hover:underline"
            onClick={() => {
              if (window.confirm("Reiniciar a demonstração? Plano, triagens e agendamentos feitos aqui serão apagados.")) {
                reset();
                router.push("/demo");
              }
            }}
          >
            Reiniciar
          </button>
        </span>
      </div>
    </div>
  );
}

export function DemoShell({
  name,
  roleLabel,
  nav,
  children,
  footer,
}: {
  name: string;
  roleLabel: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { ready } = useDemo();
  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner />
      <header className="sticky top-0 z-20 border-b border-line bg-sand/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/demo" aria-label="Início da demonstração">
            <Logo />
          </Link>
          <span className="text-right text-sm leading-tight">
            <span className="block font-bold">{name}</span>
            <span className="text-muted">{roleLabel}</span>
          </span>
        </div>
        <NavLinks items={nav} />
      </header>
      {/* O estado vem do navegador: espera carregar para não piscar dados vazios. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{ready ? children : null}</main>
      {footer}
    </div>
  );
}
