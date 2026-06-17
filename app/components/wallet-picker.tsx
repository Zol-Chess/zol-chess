import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";

const ALLOWED_WALLETS = ["Phantom", "Solflare"] as const;
export type AllowedWallet = (typeof ALLOWED_WALLETS)[number];

const INSTALL_URLS: Record<AllowedWallet, string> = {
  Phantom: "https://phantom.com/download",
  Solflare: "https://solflare.com/download",
};

function WalletPicker({
  onSelect,
  onClose,
}: {
  onSelect: (name: AllowedWallet) => void;
  onClose: () => void;
}) {
  const { wallets } = useWallet();
  const supported = wallets.filter((w) =>
    ALLOWED_WALLETS.includes(w.adapter.name as AllowedWallet)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-chess-bg border border-primary/30 p-6 flex flex-col gap-3 min-w-75"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-primary uppercase tracking-widest text-xs">
            Connect Wallet
          </span>
          <button
            className="text-chess-muted hover:text-foreground font-mono text-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {supported.map((w) => {
          const installed = w.readyState === WalletReadyState.Installed;
          const name = w.adapter.name as AllowedWallet;

          return installed ? (
            <button
              key={name}
              className="flex items-center gap-3 px-4 py-3 border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
              onClick={() => onSelect(name)}
            >
              {w.adapter.icon && (
                <img
                  src={w.adapter.icon}
                  alt={name}
                  className="w-6 h-6 rounded-sm"
                />
              )}
              <span className="font-mono text-sm text-foreground">{name}</span>
            </button>
          ) : (
            <a
              key={name}
              href={INSTALL_URLS[name]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-4 py-3 border border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3 opacity-50">
                {w.adapter.icon && (
                  <img
                    src={w.adapter.icon}
                    alt={name}
                    className="w-6 h-6 rounded-sm"
                  />
                )}
                <span className="font-mono text-sm text-foreground">
                  {name}
                </span>
              </div>
              <span className="font-mono text-xs text-primary uppercase tracking-widest">
                Install ↗
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default WalletPicker;
