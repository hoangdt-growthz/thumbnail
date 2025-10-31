import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerModule } from './crawler/crawler.module';
import { SearchModule } from './search/search.module';
import { ImageEntity } from './crawler/image.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'crawler.db',
      entities: [ImageEntity],
      synchronize: true,
    }),
    CrawlerModule,
    SearchModule,
  ],
})
export class AppModule {}
