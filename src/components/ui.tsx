import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
  secondary: "bg-white text-ink border border-line hover:border-primary hover:text-primary",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-white text-danger border border-danger/30 hover:bg-danger-soft",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${extra}`;
}

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-3xl border border-line bg-white p-5 sm:p-6 ${className}`} {...props} />;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 block text-sm font-bold">
      {children}
      {hint && <span className="ml-1 font-normal text-muted">{hint}</span>}
    </span>
  );
}

const fieldClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={4} {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      {children}
    </label>
  );
}

type Tone = "neutral" | "primary" | "lilac" | "peach" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-sand-deep text-muted",
  primary: "bg-primary-soft text-primary-dark",
  lilac: "bg-lilac-soft text-lilac",
  peach: "bg-peach-soft text-peach",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

export function Flash({ ok, erro }: { ok?: string; erro?: string }) {
  if (!ok && !erro) return null;
  return (
    <div
      role="status"
      className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${erro ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary-dark"}`}
    >
      {erro ?? ok}
    </div>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-semibold tracking-tight ${className}`}>
      Aconselh<span className="text-primary">A</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    scheduled: "primary", completed: "lilac", canceled: "neutral", no_show: "peach",
    open: "peach", closed: "neutral", active: "primary", pending: "peach", expired: "neutral",
  };
  const labels: Record<string, string> = {
    scheduled: "Agendado", completed: "Realizado", canceled: "Cancelado", no_show: "Falta",
    open: "Aguardando agendamento", closed: "Encerrada", active: "Ativo", pending: "Pendente", expired: "Expirado",
  };
  return <Badge tone={map[status] ?? "neutral"}>{labels[status] ?? status}</Badge>;
}

export function RiskBadge({ level }: { level: number }) {
  if (level === 2) return <Badge tone="danger">Risco imediato</Badge>;
  if (level === 1) return <Badge tone="peach">Atenção</Badge>;
  return null;
}
