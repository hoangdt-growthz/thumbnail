import { Repository } from 'typeorm';
import { ImageEntity } from '../crawler/image.entity';
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
export declare class SearchService {
    private readonly imageRepository;
    constructor(imageRepository: Repository<ImageEntity>);
    get(query: string): Promise<BestThumbnailResponse | null>;
    private findBestMatch;
    searchThumbnails(query: string, limit?: number): Promise<SearchResponse>;
    searchMany(queries: string[]): Promise<BestThumbnailResponse[]>;
}
