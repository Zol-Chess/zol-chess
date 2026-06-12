import path from "path";

import { clientPromise } from "@/lib/mongodb";

import { loadAndFilter } from "./puzzle-filter";

export const uploadToDB = async () => {
  try {
    const client = await clientPromise;

    const db = client.db("chess");
    const collection = db.collection("puzzles");

    const puzzles = await loadAndFilter(
      path.join(__dirname, "lichess_db_puzzle.csv.zst")
    );

    const BATCH_SIZE = 1000;

    for (let i = 0; i < puzzles.length; i += BATCH_SIZE) {
      const batch = puzzles.slice(i, i + BATCH_SIZE);

      await collection.insertMany(batch);

      console.log(`Inserted ${i + batch.length}/${puzzles.length}`);
    }

    console.log("Import complete");
    await client.close();
  } catch (error) {}
};
