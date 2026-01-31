import { Controller, Get, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import {
  HookahDbService,
  Brand,
  Tobacco,
  Line,
  PaginatedResponse,
  BrandsQueryParams,
  TobaccosQueryParams,
  LinesQueryParams,
} from './hookah-db.service';

@Controller('api/hookah-db')
export class HookahDbController {
  constructor(private readonly hookahDbService: HookahDbService) {}

  // Health check (public endpoint, no API key required)
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ status: string }> {
    return this.hookahDbService.healthCheck();
  }

  // Brands endpoints
  @Get('brands')
  @HttpCode(HttpStatus.OK)
  async getBrands(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'rating' | 'name',
    @Query('order') order?: 'asc' | 'desc',
    @Query('country') country?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<PaginatedResponse<Brand>> {
    const params: BrandsQueryParams = {};
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);
    if (sortBy) params.sortBy = sortBy;
    if (order) params.order = order;
    if (country) params.country = country;
    if (status) params.status = status;
    if (search) params.search = search;
    return this.hookahDbService.getBrands(params);
  }

  @Get('brands/:id')
  @HttpCode(HttpStatus.OK)
  async getBrandById(@Param('id') id: string): Promise<Brand> {
    return this.hookahDbService.getBrandById(id);
  }

  @Get('brands/:id/tobaccos')
  @HttpCode(HttpStatus.OK)
  async getBrandTobaccos(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'rating' | 'name',
    @Query('order') order?: 'asc' | 'desc',
  ): Promise<PaginatedResponse<Tobacco>> {
    const params: { page?: number; limit?: number; sortBy?: 'rating' | 'name'; order?: 'asc' | 'desc' } = {};
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);
    if (sortBy) params.sortBy = sortBy;
    if (order) params.order = order;
    return this.hookahDbService.getBrandTobaccos(id, params);
  }

  @Get('brands/countries')
  @HttpCode(HttpStatus.OK)
  async getBrandCountries(): Promise<string[]> {
    return this.hookahDbService.getBrandCountries();
  }

  @Get('brands/statuses')
  @HttpCode(HttpStatus.OK)
  async getBrandStatuses(): Promise<string[]> {
    return this.hookahDbService.getBrandStatuses();
  }

  // Tobaccos endpoints
  @Get('tobaccos')
  @HttpCode(HttpStatus.OK)
  async getTobaccos(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'rating' | 'name',
    @Query('order') order?: 'asc' | 'desc',
    @Query('brandId') brandId?: string,
    @Query('lineId') lineId?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
    @Query('country') country?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<PaginatedResponse<Tobacco>> {
    const params: TobaccosQueryParams = {};
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);
    if (sortBy) params.sortBy = sortBy;
    if (order) params.order = order;
    if (brandId) params.brandId = brandId;
    if (lineId) params.lineId = lineId;
    if (minRating) params.minRating = parseFloat(minRating);
    if (maxRating) params.maxRating = parseFloat(maxRating);
    if (country) params.country = country;
    if (status) params.status = status;
    if (search) params.search = search;
    return this.hookahDbService.getTobaccos(params);
  }

  @Get('tobaccos/:id')
  @HttpCode(HttpStatus.OK)
  async getTobaccoById(@Param('id') id: string): Promise<Tobacco> {
    return this.hookahDbService.getTobaccoById(id);
  }

  @Get('tobaccos/statuses')
  @HttpCode(HttpStatus.OK)
  async getTobaccoStatuses(): Promise<string[]> {
    return this.hookahDbService.getTobaccoStatuses();
  }

  // Lines endpoints
  @Get('lines')
  @HttpCode(HttpStatus.OK)
  async getLines(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('brandId') brandId?: string,
    @Query('search') search?: string,
  ): Promise<PaginatedResponse<Line>> {
    const params: LinesQueryParams = {};
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);
    if (brandId) params.brandId = brandId;
    if (search) params.search = search;
    return this.hookahDbService.getLines(params);
  }

  @Get('lines/:id')
  @HttpCode(HttpStatus.OK)
  async getLineById(@Param('id') id: string): Promise<Line> {
    return this.hookahDbService.getLineById(id);
  }

  @Get('lines/:id/tobaccos')
  @HttpCode(HttpStatus.OK)
  async getLineTobaccos(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'rating' | 'name',
    @Query('order') order?: 'asc' | 'desc',
  ): Promise<PaginatedResponse<Tobacco>> {
    const params: { page?: number; limit?: number; sortBy?: 'rating' | 'name'; order?: 'asc' | 'desc' } = {};
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);
    if (sortBy) params.sortBy = sortBy;
    if (order) params.order = order;
    return this.hookahDbService.getLineTobaccos(id, params);
  }

  @Get('lines/statuses')
  @HttpCode(HttpStatus.OK)
  async getLineStatuses(): Promise<string[]> {
    return this.hookahDbService.getLineStatuses();
  }

  // Legacy endpoints for backward compatibility (deprecated)
  @Get('flavors')
  @HttpCode(HttpStatus.OK)
  async getFlavors(
    @Query('search') search?: string,
    @Query('brand') brand?: string,
  ): Promise<Tobacco[]> {
    return this.hookahDbService.getFlavors(search, brand);
  }

  @Get('flavors/:slug')
  @HttpCode(HttpStatus.OK)
  async getFlavorBySlug(@Param('slug') slug: string): Promise<Tobacco> {
    return this.hookahDbService.getFlavorBySlug(slug);
  }
}
