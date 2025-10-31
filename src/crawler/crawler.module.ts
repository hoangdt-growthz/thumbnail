import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from './crawler.service';
import { CrawlerController } from './crawler.controller';
import { ImageEntity } from './image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ImageEntity])], // 👈 THIS LINE IS REQUIRED
  controllers: [CrawlerController],
  providers: [CrawlerService],
})
export class CrawlerModule {}
