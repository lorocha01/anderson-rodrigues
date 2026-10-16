import { DemoShell } from "../demo-shell";

const NAV = [
  { href: "/demo/admin", label: "Painel" },
  { href: "/demo/admin/atendimentos", label: "Atendimentos" },
  { href: "/demo/admin/psicologos", label: "Psicólogos" },
  { href: "/demo/admin/triagem", label: "Perguntas da triagem" },
  { href: "/demo/admin/planos", label: "Planos" },
  { href: "/demo/admin/relatorios", label: "Relatórios" },
];

export default function DemoAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoShell name="Anderson Rodrigues" roleLabel="Administração" nav={NAV}>
      {children}
    </DemoShell>
  );
}
