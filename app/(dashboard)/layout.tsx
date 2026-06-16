import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";

const FOOTER_LINKS = [
  { label: "X Twitter", href: "#" },
  { label: "Discord Node", href: "#" },
  { label: "Manifesto Docs", href: "#" },
  { label: "Privacy Policy", href: "#" },
] as const;

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

      <footer className="ml-64 border-t border-primary/20 bg-chess-bg/80 backdrop-blur-sm w-[calc(100%-256px)]">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-8 max-w-7xl mx-auto font-mono text-xs text-chess-muted tracking-widest">
          <div className="mb-4 md:mb-0">
            <span className="text-primary font-bold block mb-1 leading-short">
              ZolChess // PROTOCOL V1.0.0
            </span>
            <span className="leading-short">
              © 2024 SYSTEM GRID STRATEGY. [POWERED BY SOLANA]
            </span>
          </div>
          <div className="flex gap-8 uppercase">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-primary transition-colors leading-short"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
