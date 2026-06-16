import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import Footer from "@/components/footer";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="circuit-bg min-h-screen">
      <TopNav />
      <Sidebar />

      {children}

      <Footer />
    </div>
  );
}
