import { ActivityRow } from "./activity-row";

const ACTIVITY_FEED = [
  {
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDN3lsWeAYYtObmQU8g7EjRioxXuyOl8b8w2OEZ0VYMQf8MG040K8KQFUP0bVA9aEN8A6FzJdb9Zmi13GA0mKt2n4I1be1SL2ipgB38UlGorkyP1-r1Pv_R18J9mPeotmTZ3N8sJZYa7pRgfMxJo5sYjJQCU9wfBTW-LzYC7AV2s9OtryZaOpj_AEDzFs_O6CHdIkYMccPiI0h9Jfz6T22hAICLid4IkISQe4XYD2kqpVv3-lHnlnZJGyBvddSYaNtaRtiEc8BkH4M",
    username: "Grandmaster_X",
    puzzleId: "#PX_9241",
    reward: "0.05 SOL",
  },
  {
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDrG_KTrGXMrHnK5YhE72aJZWsNe9mEkTcM2uGfM6-5BcPEOlZhpag1cQSs95P-j4EMvUqEJy0Oq8isbnjKtw5sY7dEGOp_N5UeDsI8HIX7UKg1leAUAakXgJz2dvJGcaun85ZfNnWXzoqk8ShXY4Tisr5OJfs6F7EL4uV0tRfmZ91QStq4BE5N0OV8T86o2FHTKQ_GHoL-54cniSQzH-7bKPk7GVa1fkPVohTS-JQpSsbxKXTg8b55ktdXCrCxwBI38dud5E7_vMc",
    username: "BlockBishop",
    puzzleId: "#PX_9238",
    reward: "0.02 SOL",
  },
  {
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmxRWHXqsF2O0UieSjDGnHuquLRtArJ0Xr8xqIn5-58iSUwR5WzjBesJBjBV1I02ANZT7wB9_NHFtyTqA4jXFh7Kyo1EK329GQNztdnotjCj49D4C0cN-3i3079DOvmo3T8lNmn8SGjcOtbDJsvNys_vfhYXdAW65jHT4JcUPuURiwOjaXPFscEwuhPy1CSQ5-ayECjcxtD9Xzct-ev8Tzs-4e4sWEVpGQkLu4GOqy2AH0kW9y-ve3z7qEajqq6JJA6F8n4ODmQCc",
    username: "0xChessKing",
    puzzleId: "#PX_9211",
    reward: "0.12 SOL",
  },
] as const;

const LiveActivity = () => {
  return (
    <section className="mt-6 glass-panel neon-border overflow-hidden">
      <div className="bg-primary/5 px-6 py-4 border-b border-primary/20 flex justify-between items-center">
        <h3 className="font-mono text-xs text-primary font-bold flex items-center gap-2 uppercase tracking-[0.2em] leading-short">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          Live Scores
        </h3>
        <span className="font-mono text-xs text-chess-muted uppercase tracking-widest leading-short">
          Sync Latency: 0.1ms
        </span>
      </div>

      <div className="divide-y divide-primary/10 max-h-56 overflow-y-auto">
        {ACTIVITY_FEED.map((entry) => (
          <ActivityRow key={entry.puzzleId} {...entry} />
        ))}
      </div>

      <div className="p-3 bg-primary/5 flex justify-center border-t border-primary/10">
        <button className="text-primary font-mono text-xs cursor-pointer uppercase tracking-widest hover:text-foreground transition-all flex items-center gap-2 leading-short">
          <span className="material-symbols-outlined text-sm">history</span>
          Access Full Archive Stream
        </button>
      </div>
    </section>
  );
};

export default LiveActivity;
