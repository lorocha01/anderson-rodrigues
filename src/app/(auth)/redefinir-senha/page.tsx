import type { Metadata } from "next";
import { Field, Flash, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { updatePassword } from "../actions";

export const metadata: Metadata = { title: "Nova senha" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-semibold">Crie uma nova senha</h1>
      <Flash erro={erro} />
      <form action={updatePassword} className="space-y-4">
        <Field label="Nova senha" hint="mínimo 8 caracteres">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="w-full">Salvar senha</SubmitButton>
      </form>
    </>
  );
}
