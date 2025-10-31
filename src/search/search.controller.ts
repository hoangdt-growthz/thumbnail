import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  SearchService,
  SearchResponse,
  BestThumbnailResponse,
} from './search.service';

class SearchDto {
  query: string;
  limit?: number;
}

class BatchSearchDto {
  queries: string[];
}

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async searchImagesGet(
    @Query('query') query: string,
  ): Promise<BestThumbnailResponse | null> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required');
    }

    return this.searchService.get(query);
  }

  @Post()
  async searchImagesPost(
    @Body() searchDto: SearchDto,
  ): Promise<SearchResponse> {
    if (!searchDto.query || searchDto.query.trim().length === 0) {
      throw new BadRequestException('Query is required');
    }

    const limit = searchDto.limit || 10;
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    return this.searchService.searchThumbnails(searchDto.query, limit);
  }

  @Post('batch')
  async searchImagesBatch(
    @Body() batchDto: BatchSearchDto,
  ): Promise<BestThumbnailResponse[]> {
    if (
      !batchDto.queries ||
      !Array.isArray(batchDto.queries) ||
      batchDto.queries.length === 0
    ) {
      throw new BadRequestException('Queries array is required');
    }

    return this.searchService.searchMany(batchDto.queries);
  }
}
