"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/navbar";

export function LayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col h-screen bg-[#ECE9E2] dark:bg-black transition-colors duration-200">
      <Navbar />
      <main className="flex-grow overflow-hidden">{children}</main>
      <footer className="w-full flex items-center justify-center py-1">
        <p className="text-xs text-default-500">© 2025 QUANT.</p>
      </footer>
    </div>
  );
}
