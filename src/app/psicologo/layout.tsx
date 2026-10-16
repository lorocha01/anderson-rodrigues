import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const NAV = [
  { href: "/psicologo", label: "Agenda" },
  { href: "/psicologo/disponibilidade", label: "Disponibilidade" },
  { href: "/psicologo/perfil", label: "Meu perfil" },
];

export default async function PsychologistLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("psychologist");
  return (
    <AppShell name={profile.full_name} roleLabel="Psicólogo(a)" nav={NAV}>
      {children}
    </AppShell>
  );
}
