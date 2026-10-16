import Link from "next/link";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/ui";
import { NavLinks } from "@/components/nav-links";

export function AppShell({
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
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-sand/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Início">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block font-bold">{name}</span>
              <span className="text-muted">{roleLabel}</span>
            </span>
            <form action={signOut}>
              <button className="rounded-full px-3 py-1.5 font-bold text-muted hover:bg-sand-deep hover:text-ink">Sair</button>
            </form>
          </div>
        </div>
        <NavLinks items={nav} />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      {footer}
    </div>
  );
}
