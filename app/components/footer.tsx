import Link from "next/link";

const FOOTER_LINKS = [
  { label: "X Twitter", href: "#" },
  { label: "Discord Node", href: "#" },
  { label: "Manifesto Docs", href: "#" },
  { label: "Privacy Policy", href: "#" },
] as const;

const Footer = () => {
  return (
    <footer className="border-t border-primary/20 bg-chess-bg/80 backdrop-blur-sm lg:ml-64 lg:w-[calc(100%-256px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto font-mono text-xs text-chess-muted tracking-widest">
        <div>
          <span className="text-primary font-bold block mb-1 leading-short">
            ZolChess // PROTOCOL V1.0.0
          </span>
          <span className="leading-short">
            © 2024 SYSTEM GRID STRATEGY. [POWERED BY SOLANA]
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 uppercase sm:flex sm:gap-8">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-primary transition-colors leading-short"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
