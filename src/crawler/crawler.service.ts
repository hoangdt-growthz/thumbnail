import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageEntity } from './image.entity';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly baseUrl = 'https://thumbnails.libretro.com/';

  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
  ) {}

  async crawlAll(): Promise<void> {
    const folders = await this.getSubfolders(this.baseUrl);
    for (const folder of folders) {
      const namedBoxarts = `${this.baseUrl}${folder}Named_Boxarts/`;
      await this.crawlBoxarts(namedBoxarts, folder);
    }
  }

  private async getSubfolders(url: string): Promise<string[]> {
    const { data } = await axios.get<string>(url);
    const $ = cheerio.load(data);
    return $('a')
      .map((_, el) => $(el).attr('href'))
      .get()
      .filter((link) => link.endsWith('/') && link !== '../');
  }

  private async crawlBoxarts(url: string, gameFolder: string): Promise<void> {
    try {
      const { data } = await axios.get<string>(url);
      const $ = cheerio.load(data);
      const links = $('a')
        .map((_, el) => $(el).attr('href'))
        .get()
        .filter((link) => link.match(/\.(png|jpg|jpeg)$/i));

      for (const link of links) {
        const fullUrl = `${url}${link}`;
        await this.saveImage(gameFolder.replace('/', ''), link, fullUrl);
      }

      this.logger.log(`✅ ${links.length} images saved from ${gameFolder}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.warn(`⚠️ Failed to crawl ${url}: ${error.message}`);
    }
  }

  private async saveImage(
    folder: string,
    filename: string,
    url: string,
  ): Promise<void> {
    const exists = await this.imageRepo.findOne({ where: { url } });
    if (!exists) {
      await this.imageRepo.save({ folder, filename, url });
    }
  }

}
