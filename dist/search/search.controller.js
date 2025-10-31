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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const search_service_1 = require("./search.service");
class SearchDto {
    query;
    limit;
}
class BatchSearchDto {
    queries;
}
let SearchController = class SearchController {
    searchService;
    constructor(searchService) {
        this.searchService = searchService;
    }
    async searchImagesGet(query) {
        if (!query || query.trim().length === 0) {
            throw new common_1.BadRequestException('Query parameter is required');
        }
        return this.searchService.get(query);
    }
    async searchImagesPost(searchDto) {
        if (!searchDto.query || searchDto.query.trim().length === 0) {
            throw new common_1.BadRequestException('Query is required');
        }
        const limit = searchDto.limit || 10;
        if (limit < 1 || limit > 100) {
            throw new common_1.BadRequestException('Limit must be between 1 and 100');
        }
        return this.searchService.searchThumbnails(searchDto.query, limit);
    }
    async searchImagesBatch(batchDto) {
        if (!batchDto.queries ||
            !Array.isArray(batchDto.queries) ||
            batchDto.queries.length === 0) {
            throw new common_1.BadRequestException('Queries array is required');
        }
        return this.searchService.searchMany(batchDto.queries);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchImagesGet", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SearchDto]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchImagesPost", null);
__decorate([
    (0, common_1.Post)('batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BatchSearchDto]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchImagesBatch", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map