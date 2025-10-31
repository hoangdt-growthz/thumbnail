import { Repository } from 'typeorm';
import { ImageEntity } from './image.entity';
export declare class CrawlerService {
    private readonly imageRepo;
    private readonly logger;
    private readonly baseUrl;
    constructor(imageRepo: Repository<ImageEntity>);
    crawlAll(): Promise<void>;
    private getSubfolders;
    private crawlBoxarts;
    private saveImage;
}
