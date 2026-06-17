import { TopNav } from "@/components/dashboard/top-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import Footer from "@/components/footer";
import PuzzlesWrapper from "@/components/puzzle/puzzles-wrapper";

import "@/styles/chess-puzzle.css";

export default function PuzzlesPage() {
  return (
    <div className="circuit-bg min-h-screen">
      <TopNav />
      <Sidebar />

      <PuzzlesWrapper />

      <Footer />
    </div>
  );
}
