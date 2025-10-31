import { SearchService, SearchResponse, BestThumbnailResponse } from './search.service';
declare class SearchDto {
    query: string;
    limit?: number;
}
declare class BatchSearchDto {
    queries: string[];
}
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchImagesGet(query: string): Promise<BestThumbnailResponse | null>;
    searchImagesPost(searchDto: SearchDto): Promise<SearchResponse>;
    searchImagesBatch(batchDto: BatchSearchDto): Promise<BestThumbnailResponse[]>;
}
export {};
