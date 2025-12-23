"use client";

import type { ReactNode } from "react";
import { PageNavbar } from "@/components/page-navbar";
import { FirebaseDiagnostics } from "@/components/firebase-diagnostics";

export function LayoutContent({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex flex-col h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: "transparent", maxHeight: "100dvh" }}
    >
      <PageNavbar />
      <main
        className="flex-1 relative z-0 overflow-hidden m-0 p-0 w-full"
        style={{ minHeight: 0, maxHeight: "100%", overscrollBehavior: "none" }}
      >
        {children}
      </main>
      <FirebaseDiagnostics />
    </div>
  );
}
