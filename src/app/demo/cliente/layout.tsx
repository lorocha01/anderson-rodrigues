import { CrisisFooter } from "@/components/crisis";
import { DemoShell } from "../demo-shell";

const NAV = [
  { href: "/demo/cliente", label: "Início" },
  { href: "/demo/cliente/triagem", label: "Quero conversar" },
  { href: "/demo/cliente/atendimentos", label: "Meus atendimentos" },
  { href: "/demo/cliente/planos", label: "Planos" },
];

export default function DemoClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoShell name="Cliente da demonstração" roleLabel="Cliente" nav={NAV} footer={<CrisisFooter />}>
      {children}
    </DemoShell>
  );
}
