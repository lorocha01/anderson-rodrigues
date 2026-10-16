import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { type FlashParams } from "@/lib/flash";
import { Card, Field, Flash, Input, PageHeader, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { updateMyProfile } from "../actions";
import type { Psychologist } from "@/lib/types";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function MyProfilePage({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { profile } = await requireRole("psychologist");
  // meet_url não é legível pelo papel "authenticated"; lemos só o próprio registro pelo servidor.
  const { data: psy } = await createAdminClient().from("psychologists").select("*").eq("id", profile.id).maybeSingle<Psychologist>();

  if (!psy) {
    return <Card>Seu cadastro profissional ainda não foi concluído pela administração.</Card>;
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Meu perfil" subtitle={`${psy.display_name} · CRP ${psy.crp}`} />
      <Flash ok={ok} erro={erro} />
      <Card>
        <form action={updateMyProfile} className="space-y-5">
          <Field label="Link fixo da sua sala no Google Meet" hint="enviado ao cliente no agendamento">
            <Input name="meet_url" type="url" placeholder="https://meet.google.com/abc-defg-hij" defaultValue={psy.meet_url ?? ""} />
          </Field>
          <Field label="Abordagem" hint="ex.: TCC, Psicanálise, Humanista">
            <Input name="approach" defaultValue={psy.approach} />
          </Field>
          <Field label="Sobre você" hint="aparece para o cliente quando ele escolhe o profissional">
            <Textarea name="bio" defaultValue={psy.bio} rows={5} />
          </Field>
          <Field label="URL da foto" hint="opcional">
            <Input name="photo_url" type="url" defaultValue={psy.photo_url ?? ""} />
          </Field>
          <SubmitButton>Salvar</SubmitButton>
        </form>
      </Card>
      {!psy.active && (
        <p className="mt-4 rounded-2xl bg-peach-soft px-4 py-3 text-sm font-semibold text-peach">
          Seu perfil está desativado. Novos clientes não conseguem agendar com você.
        </p>
      )}
    </div>
  );
}
