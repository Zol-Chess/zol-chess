"use client";

import { useState, type ReactNode } from "react";

import Footer from "@/components/footer";

import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="circuit-bg min-h-screen">
      <TopNav onMenuClick={() => setMobileSidebarOpen(true)} />
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {children}

      <Footer />
    </div>
  );
}
