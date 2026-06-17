import PuzzleByIdWrapper from "@/components/puzzle/puzzle-by-id-wrapper";

import "@/styles/chess-puzzle.css";

export default async function PuzzlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="circuit-bg min-h-screen">
      <PuzzleByIdWrapper id={id} />
    </div>
  );
}
