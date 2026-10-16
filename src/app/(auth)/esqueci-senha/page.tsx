import type { Metadata } from "next";
import { Field, Flash, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Esqueceu a senha?</h1>
      <p className="mb-6 mt-1 text-muted">Enviamos um link para você criar uma nova.</p>
      <Flash ok={ok} />
      <form action={requestPasswordReset} className="space-y-4">
        <Field label="E-mail">
          <Input name="email" type="email" required />
        </Field>
        <SubmitButton className="w-full">Enviar link</SubmitButton>
      </form>
    </>
  );
}
