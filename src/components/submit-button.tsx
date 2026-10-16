"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui";

export function SubmitButton({
  children,
  pendingText = "Aguarde…",
  variant = "primary",
  className = "",
  confirm,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass(variant, className)}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
