"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const image_entity_1 = require("./image.entity");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    imageRepo;
    logger = new common_1.Logger(CrawlerService_1.name);
    baseUrl = 'https://thumbnails.libretro.com/';
    constructor(imageRepo) {
        this.imageRepo = imageRepo;
    }
    async crawlAll() {
        const folders = await this.getSubfolders(this.baseUrl);
        for (const folder of folders) {
            const namedBoxarts = `${this.baseUrl}${folder}Named_Boxarts/`;
            await this.crawlBoxarts(namedBoxarts, folder);
        }
    }
    async getSubfolders(url) {
        const { data } = await axios_1.default.get(url);
        const $ = cheerio.load(data);
        return $('a')
            .map((_, el) => $(el).attr('href'))
            .get()
            .filter((link) => link.endsWith('/') && link !== '../');
    }
    async crawlBoxarts(url, gameFolder) {
        try {
            const { data } = await axios_1.default.get(url);
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
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            this.logger.warn(`⚠️ Failed to crawl ${url}: ${error.message}`);
        }
    }
    async saveImage(folder, filename, url) {
        const exists = await this.imageRepo.findOne({ where: { url } });
        if (!exists) {
            await this.imageRepo.save({ folder, filename, url });
        }
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(image_entity_1.ImageEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map