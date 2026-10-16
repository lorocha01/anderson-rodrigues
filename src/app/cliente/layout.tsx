import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { CrisisFooter } from "@/components/crisis";

const NAV = [
  { href: "/cliente", label: "Início" },
  { href: "/cliente/triagem", label: "Quero conversar" },
  { href: "/cliente/atendimentos", label: "Meus atendimentos" },
  { href: "/cliente/planos", label: "Planos" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("client");
  return (
    <AppShell name={profile.full_name} roleLabel="Cliente" nav={NAV} footer={<CrisisFooter />}>
      {children}
    </AppShell>
  );
}
