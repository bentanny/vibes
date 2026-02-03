"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";

export default function AgentPage() {
  const router = useRouter();

  return (
    <DashboardView
      strategy="Help me create a new trading strategy."
      imgSrc=""
      onGoBack={() => router.push("/strategies")}
    />
  );
}
