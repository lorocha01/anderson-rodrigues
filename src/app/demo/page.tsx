import Link from "next/link";
import { Logo } from "@/components/ui";
import { DemoBanner } from "./demo-shell";

const PROFILES = [
  {
    href: "/demo/cliente",
    icon: "🙋",
    title: "Cliente",
    text: "Escolhe um plano, responde a triagem, agenda o horário e entra na chamada.",
  },
  {
    href: "/demo/psicologo",
    icon: "🧑‍⚕️",
    title: "Psicóloga",
    text: "Vê a agenda com o resumo da triagem de cada cliente e registra os atendimentos.",
  },
  {
    href: "/demo/admin",
    icon: "🗂️",
    title: "Administração",
    text: "Painel, psicólogos, perguntas da triagem, planos, alertas de risco e relatórios.",
  },
];

export default function DemoHome() {
  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-12">
        <Logo className="text-3xl" />
        <h1 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">Conheça a plataforma por dentro</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted">
          Escolha um perfil. Dica: comece como cliente, agende um atendimento e depois abra a visão da psicóloga e da
          administração para ver o mesmo atendimento do outro lado.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PROFILES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="flex flex-col rounded-3xl border border-line bg-white p-6 transition hover:border-primary hover:shadow-sm"
            >
              <span className="text-4xl" aria-hidden>{p.icon}</span>
              <span className="mt-4 font-display text-xl font-semibold">{p.title}</span>
              <span className="mt-1 text-sm text-muted">{p.text}</span>
              <span className="mt-4 text-sm font-bold text-primary">Entrar →</span>
            </Link>
          ))}
        </div>
        <Link href="/" className="mt-8 text-sm font-bold text-muted hover:text-ink">← Ver a página inicial</Link>
      </main>
    </div>
  );
}
