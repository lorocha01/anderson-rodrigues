import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const NAV = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/atendimentos", label: "Atendimentos" },
  { href: "/admin/triagens", label: "Alertas de risco" },
  { href: "/admin/psicologos", label: "Psicólogos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/triagem", label: "Perguntas da triagem" },
  { href: "/admin/planos", label: "Planos" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("admin");
  return (
    <AppShell name={profile.full_name} roleLabel="Administração" nav={NAV}>
      {children}
    </AppShell>
  );
}
