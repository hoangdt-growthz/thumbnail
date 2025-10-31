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

interface NormalizedImage {
  url: string;
  title: string;
  folder: string;
  normalizedText: string;
  normalizedFolder: string;
}

@Injectable()
export class SearchService {
  private imageCache: NormalizedImage[] | null = null;
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

  private async getCachedImages(): Promise<NormalizedImage[]> {
    const now = Date.now();
    if (!this.imageCache || now - this.lastCacheUpdate > this.CACHE_TTL) {
      const images = await this.imageRepository.find();
      this.imageCache = images.map((img) => ({
        url: img.url,
        title: img.filename,
        folder: img.folder,
        normalizedText: normalise(`${img.folder} ${img.filename}`),
        normalizedFolder: normalise(img.folder),
      }));
      this.lastCacheUpdate = now;
    }
    return this.imageCache;
  }

  private async findBestMatch(
    query: string,
    candidates?: NormalizedImage[],
  ): Promise<BestThumbnailResponse | null> {
    const search = normalise(query);
    if (!search) return null;

    const images = candidates ?? (await this.getCachedImages());

    // Extract potential game/system name from query (first few words)
    const queryWords = search.split(' ');
    const potentialSystem = queryWords.slice(0, 2).join(' ');

    let bestMatch: {
      url: string;
      title: string;
      folder: string;
      score: number;
    } | null = null;

    // Quick pass: filter by system/folder relevance first
    const relevantImages = images.filter((img) => {
      // Skip if folder/system doesn't match at all (no common words)
      const folderWords = img.normalizedFolder.split(' ');
      const hasCommonWord = queryWords.some((qw) =>
        folderWords.some((fw) => fw.includes(qw) || qw.includes(fw)),
      );
      return hasCommonWord || img.normalizedText.includes(queryWords[0]);
    });

    // If no relevant matches, return null (wrong game)
    if (relevantImages.length === 0) return null;

    // Search through relevant images only
    const searchImages = relevantImages.length > 0 ? relevantImages : images;

    for (const img of searchImages) {
      const score = stringSimilarity.compareTwoStrings(
        search,
        img.normalizedText,
      );

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          url: img.url,
          title: img.title,
          folder: img.folder,
          score,
        };
      }

      if (bestMatch.score >= 0.99) break; // near-perfect match
    }

    // Don't return if score is too low (wrong game)
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
  async searchThumbnails(query: string, limit = 10): Promise<SearchResponse> {
    const search = normalise(query);
    if (!search) return [];

    const candidates = await this.getCachedImages();
    const queryWords = search.split(' ');

    // Pre-filter candidates
    const relevantCandidates = candidates.filter((img) => {
      const folderWords = img.normalizedFolder.split(' ');
      return queryWords.some((qw) =>
        folderWords.some((fw) => fw.includes(qw) || qw.includes(fw)),
      );
    });

    const searchCandidates =
      relevantCandidates.length > 0 ? relevantCandidates : candidates;

    const results = searchCandidates
      .map((img) => {
        const similarity = stringSimilarity.compareTwoStrings(
          search,
          img.normalizedText,
        );
        return {
          title: img.title,
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
    const candidates = await this.getCachedImages();
    
    // Process in parallel but reuse cached data
    const responses = await Promise.all(
      queries.map(async (query) => {
        const match = await this.findBestMatch(query, candidates);
        return (
          match ?? {
            query,
            title: '',
            system: '',
            similarity: 0,
            url: '',
          }
        );
      }),
    );

    return responses;
  }

  // Optional: clear cache manually if needed
  clearCache(): void {
    this.imageCache = null;
  }
}
