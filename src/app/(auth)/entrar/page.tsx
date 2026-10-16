import Link from "next/link";
import type { Metadata } from "next";
import { Field, Flash, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; ok?: string; erro?: string }> }) {
  const { next, ok, erro } = await searchParams;
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Que bom te ver</h1>
      <p className="mb-6 mt-1 text-muted">Entre para acessar sua área.</p>
      <Flash ok={ok} erro={erro} />
      <form action={signIn} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="E-mail">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Senha">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="w-full" pendingText="Entrando…">Entrar</SubmitButton>
      </form>
      <div className="mt-6 flex justify-between text-sm">
        <Link href="/esqueci-senha" className="font-semibold text-muted hover:text-primary">Esqueci minha senha</Link>
        <Link href="/cadastro" className="font-bold text-primary">Criar conta</Link>
      </div>
    </>
  );
}
