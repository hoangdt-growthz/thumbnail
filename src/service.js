import * as cheerio from "cheerio";
import stringSimilarity from "string-similarity";

const BASE_URL = "https://thumbnails.libretro.com";
const BOXART_FOLDER = "Named_Boxarts";
const MIN_MATCH_SCORE = 0.55;
const REQUEST_TIMEOUT_MS = 15000;

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const normalise = (value) =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const decodeName = (text) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

const fetchWithTimeout = async (path) => {
  const url = new URL(path, BASE_URL);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "crawlthumb-node/0.1 (+https://github.com/)" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
};

const parseDirectories = (html) => {
  const $ = cheerio.load(html);
  const systems = [];

  $("a").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    const label = ($(element).text() ?? "").trim();

    if (!href.endsWith("/") || href === "../") {
      return;
    }

    const path = href.slice(0, -1);
    const name = label.replace(/\/$/, "").trim() || path;

    if (path) {
      systems.push({ name, path });
    }
  });

  return systems;
};

const parseFiles = (html) => {
  const $ = cheerio.load(html);
  const files = [];

  $("a").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    if (!href || href === "../" || href.endsWith("/")) {
      return;
    }
    if (!href.toLowerCase().endsWith(".png")) {
      return;
    }
    const text = ($(element).text() ?? "").trim() || href;
    files.push({ name: decodeName(text), href });
  });

  return files;
};

export class ThumbnailService {
  constructor() {
    this.systemsPromise = null;
    this.boxartCache = new Map();
  }

  async listSystems() {
    if (!this.systemsPromise) {
      this.systemsPromise = fetchWithTimeout("/")
        .then((html) => parseDirectories(html))
        .catch((error) => {
          this.systemsPromise = null;
          throw error;
        });
    }
    return this.systemsPromise;
  }

  async listBoxartEntries(system) {
    if (this.boxartCache.has(system.path)) {
      return this.boxartCache.get(system.path);
    }

    try {
      const html = await fetchWithTimeout(
        `/${system.path}/${BOXART_FOLDER}/`.replace(/\/{2,}/g, "/"),
      );
      const entries = parseFiles(html);
      this.boxartCache.set(system.path, entries);
      return entries;
    } catch (error) {
      // Cache empty array to avoid retry storms on failing systems.
      this.boxartCache.set(system.path, []);
      return [];
    }
  }

  async findBestThumbnail(query) {
    const search = normalise(query);
    if (!search) {
      return null;
    }

    const systems = await this.listSystems();
    let best = null;

    for (const system of systems) {
      const entries = await this.listBoxartEntries(system);

      for (const entry of entries) {
        const score = stringSimilarity.compareTwoStrings(
          search,
          normalise(entry.name),
        );

        if (!best || score > best.score) {
          best = { system, entry, score };
        }
      }

      if (best && best.score >= 0.99) {
        break;
      }

      // Be polite to the remote server.
      await sleep(50);
    }

    if (best && best.score >= MIN_MATCH_SCORE) {
      const thumbnailUrl = new URL(
        `/${best.system.path}/${BOXART_FOLDER}/${best.entry.href}`.replace(
          /\/{2,}/g,
          "/",
        ),
        BASE_URL,
      ).toString();

      return {
        query,
        title: best.entry.name,
        system: best.system.name,
        similarity: Number(best.score.toFixed(4)),
        thumbnailUrl,
      };
    }

    return null;
  }
}

export const constants = { BASE_URL, BOXART_FOLDER };
