import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8">
        <Logo className="text-3xl" />
      </Link>
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 sm:p-8">{children}</div>
    </div>
  );
}
