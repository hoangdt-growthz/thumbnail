"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const image_entity_1 = require("../crawler/image.entity");
const string_similarity_1 = __importDefault(require("string-similarity"));
const MIN_MATCH_SCORE = 0.3;
const normalise = (value) => value
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
let SearchService = class SearchService {
    imageRepository;
    constructor(imageRepository) {
        this.imageRepository = imageRepository;
    }
    async get(query) {
        return this.findBestMatch(query);
    }
    async findBestMatch(query, candidates) {
        const search = normalise(query);
        if (!search)
            return null;
        const images = candidates ?? (await this.imageRepository.find());
        let bestMatch = null;
        for (const img of images) {
            const name = normalise(img.filename);
            const folder = normalise(img.folder);
            const text = `${folder} ${name}`.trim();
            const score = string_similarity_1.default.compareTwoStrings(search, text);
            if (!bestMatch || score > bestMatch.score) {
                bestMatch = {
                    url: img.url,
                    title: img.filename,
                    folder: img.folder,
                    score,
                };
            }
            if (bestMatch.score >= 0.99)
                break;
        }
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
    async searchThumbnails(query, limit = 10) {
        const search = normalise(query);
        if (!search)
            return [];
        const candidates = await this.imageRepository.find();
        const results = candidates
            .map((img) => {
            const text = normalise(`${img.folder} ${img.filename}`);
            const similarity = string_similarity_1.default.compareTwoStrings(search, text);
            return {
                title: img.filename,
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
    async searchMany(queries) {
        const candidates = await this.imageRepository.find();
        const responses = await Promise.all(queries.map(async (query) => {
            const match = await this.findBestMatch(query, candidates);
            return match ?? { query };
        }));
        return responses;
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(image_entity_1.ImageEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SearchService);
//# sourceMappingURL=search.service.js.map