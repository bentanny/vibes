"use client";

import { useRouter } from "next/navigation";
import { SettingsView } from "@/components/settings-view";

export default function SettingsPage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return <SettingsView onGoHome={handleGoHome} />;
}
