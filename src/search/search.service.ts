import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageEntity } from '../crawler/image.entity';
import stringSimilarity from 'string-similarity';

const MIN_MATCH_SCORE = 0.3;

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // remove parentheses
    .replace(/[^a-z0-9]+/g, ' ') // remove symbols
    .trim();

export interface ThumbnailSearchResult {
  title: string;
  url: string;
  similarity: number;
  folder: string;
}

export type SearchResponse = ThumbnailSearchResult[];

export interface BestThumbnailResponse {
  query: string;
  title?: string;
  similarity?: number;
  url?: string;
  system?: string;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
  ) {}

  /**
   * Finds the best matching image URL from the local .db based on user input.
   */
  async get(query: string): Promise<BestThumbnailResponse | null> {
    return this.findBestMatch(query);
  }

  private async findBestMatch(
    query: string,
    candidates?: ImageEntity[],
  ): Promise<BestThumbnailResponse | null> {
    const search = normalise(query);
    if (!search) return null;

    // --- Step 1: Fetch all candidate images ---
    // You can filter by folder if your DB is large; here we fetch everything for simplicity
    const images = candidates ?? (await this.imageRepository.find());

    let bestMatch: {
      url: string;
      title: string;
      folder: string;
      score: number;
    } | null = null;

    // --- Step 2: Compare similarity for each entry ---
    for (const img of images) {
      const name = normalise(img.filename);
      const folder = normalise(img.folder);
      const text = `${folder} ${name}`.trim();

      const score = stringSimilarity.compareTwoStrings(search, text);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          url: img.url,
          title: img.filename,
          folder: img.folder,
          score,
        };
      }

      if (bestMatch.score >= 0.99) break; // near-perfect match
    }

    // --- Step 3: Return result if above threshold ---
    if (bestMatch && bestMatch.score >= MIN_MATCH_SCORE) {
      return {
        query,
        title: bestMatch.title,
        system: bestMatch.folder,
        similarity: Number(bestMatch.score.toFixed(4)),
        url: bestMatch.url,
      };
    }

    return null;
  }

  /**
   * Optional: finds top-N results instead of just the best one.
   */
  async searchThumbnails(
    query: string,
    limit = 10,
  ): Promise<SearchResponse> {
    const search = normalise(query);
    if (!search) return [];

    const candidates = await this.imageRepository.find();

    const results = candidates
      .map((img) => {
        const text = normalise(`${img.folder} ${img.filename}`);
        const similarity = stringSimilarity.compareTwoStrings(search, text);
        return {
          title: img.filename,
          url: img.url,
          folder: img.folder,
          similarity,
        };
      })
      .filter((r) => r.similarity >= MIN_MATCH_SCORE)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  }

  async searchMany(queries: string[]): Promise<BestThumbnailResponse[]> {
    const candidates = await this.imageRepository.find();
    const responses = await Promise.all(
      queries.map(async (query) => {
        const match = await this.findBestMatch(query, candidates);
        return match ?? { query };
      }),
    );

    return responses;
  }

}
