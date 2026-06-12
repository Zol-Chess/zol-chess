import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { matchmaking } from "./app/lib/chess/matchmaking";
import { gameManager } from "./app/lib/chess/game-manager";
import type { JoinQueuePayload, MakeMovePayload, ResignPayload } from "./server/src/types/chess";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL ?? "http://localhost:3000" },
  });

  io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("queue:join", (_payload: JoinQueuePayload) => {
      // TODO: matchmaking.join() → if paired, gameManager.create() → emit "game:found"
    });

    socket.on("queue:leave", () => matchmaking.leave(socket.id));

    socket.on("game:move", (_payload: MakeMovePayload) => {
      // TODO: gameManager.makeMove() → io.to(gameId).emit("game:update", updatedGame)
    });

    socket.on("game:resign", (_payload: ResignPayload) => {
      // TODO: gameManager.resign() → io.to(gameId).emit("game:over", result)
    });

    socket.on("disconnect", () => {
      matchmaking.leave(socket.id);
      // TODO: grace-period timer → mark game "abandoned"
    });
  });

  const PORT = process.env.PORT ?? 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
