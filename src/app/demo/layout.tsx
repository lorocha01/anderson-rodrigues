import type { Metadata } from "next";
import { DemoProvider } from "./store";

export const metadata: Metadata = {
  title: { default: "Demonstração", template: "%s · Demonstração AconselhA" },
  robots: { index: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
