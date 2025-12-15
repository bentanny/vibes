"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { SettingsView } from "@/components/settings-view";

function SettingsContent() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return <SettingsView onGoHome={handleGoHome} />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
