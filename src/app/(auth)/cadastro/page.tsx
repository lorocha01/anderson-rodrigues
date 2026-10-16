import Link from "next/link";
import type { Metadata } from "next";
import { Field, Flash, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ plano?: string; erro?: string }> }) {
  const { plano, erro } = await searchParams;
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Crie sua conta</h1>
      <p className="mb-6 mt-1 text-muted">Leva menos de um minuto.</p>
      <Flash erro={erro} />
      <form action={signUp} className="space-y-4">
        <input type="hidden" name="plano" value={plano ?? ""} />
        <Field label="Nome completo">
          <Input name="full_name" autoComplete="name" required />
        </Field>
        <Field label="Celular (WhatsApp)" hint="opcional">
          <Input name="phone" type="tel" autoComplete="tel" placeholder="(51) 99999-9999" />
        </Field>
        <Field label="E-mail">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Senha" hint="mínimo 8 caracteres">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <label className="flex gap-3 rounded-2xl bg-sand p-4 text-sm">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-primary" />
          <span>
            Li e aceito os termos de uso e autorizo o tratamento dos meus dados, inclusive dados sensíveis de saúde,
            para fins de triagem e atendimento, conforme a LGPD.
          </span>
        </label>
        <SubmitButton className="w-full" pendingText="Criando conta…">Criar conta</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta? <Link href="/entrar" className="font-bold text-primary">Entrar</Link>
      </p>
    </>
  );
}
