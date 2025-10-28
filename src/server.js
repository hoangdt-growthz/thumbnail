import express from "express";
import { ThumbnailService } from "./service.js";

const PORT = process.env.PORT ?? 3000;

const createApp = () => {
  const app = express();
  const service = new ThumbnailService();

  app.get("/", (_req, res) => {
    res.json({
      message: "Libretro Thumbnail Lookup API",
      endpoints: ["/thumbnail?game=<title>"],
    });
  });

  app.get("/thumbnail", async (req, res) => {
    const game = req.query.game;

    if (typeof game !== "string" || !game.trim()) {
      return res
        .status(400)
        .json({ error: "Query parameter 'game' is required" });
    }

    try {
      const result = await service.findBestThumbnail(game);
      if (!result) {
        return res.status(404).json({ error: "No thumbnail match found" });
      }
      return res.json(result);
    } catch (error) {
      console.error("[thumbnail] lookup failed", error);
      return res
        .status(502)
        .json({ error: "Failed to query thumbnail service" });
    }
  });

  return app;
};

export const app = createApp();

if (process.argv[1] === decodeURI(new URL(import.meta.url).pathname)) {
  const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  const closeServer = () => {
    server.close(() => {
      console.log("Server stopped");
    });
  };

  process.on("SIGTERM", closeServer);
  process.on("SIGINT", closeServer);
}
