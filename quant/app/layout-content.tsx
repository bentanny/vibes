"use client";

import type { ReactNode } from "react";
import { PageNavbar } from "@/components/page-navbar";

export function LayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <PageNavbar />
      <main className="flex-grow relative z-0 overflow-auto">{children}</main>
    </div>
  );
}
