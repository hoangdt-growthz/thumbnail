import { Controller, Get } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get('start')
  async start() {
    await this.crawlerService.crawlAll();
    return { message: 'Crawling started successfully' };
  }
}
