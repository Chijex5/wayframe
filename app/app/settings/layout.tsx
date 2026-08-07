// app/app/settings/layout.tsx
import React from "react";
import { AppHeader } from "@/components/AppHeader";
import { SettingsSidebar } from "@/components/SettingsSidebar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-bg">
      <AppHeader mode="dashboard" />
      <div className="flex flex-1 flex-col md:flex-row">
        <SettingsSidebar />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
