import { Controller, Get, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { HookahDbService, Brand, Flavor } from './hookah-db.service';

@Controller('api/hookah-db')
export class HookahDbController {
  constructor(private readonly hookahDbService: HookahDbService) {}

  @Get('brands')
  @HttpCode(HttpStatus.OK)
  async getBrands(@Query('search') search?: string): Promise<Brand[]> {
    return this.hookahDbService.getBrands(search);
  }

  @Get('brands/:slug')
  @HttpCode(HttpStatus.OK)
  async getBrandBySlug(@Param('slug') slug: string): Promise<Brand> {
    return this.hookahDbService.getBrandBySlug(slug);
  }

  @Get('flavors')
  @HttpCode(HttpStatus.OK)
  async getFlavors(
    @Query('search') search?: string,
    @Query('brand') brand?: string,
  ): Promise<Flavor[]> {
    return this.hookahDbService.getFlavors(search, brand);
  }

  @Get('flavors/:slug')
  @HttpCode(HttpStatus.OK)
  async getFlavorBySlug(@Param('slug') slug: string): Promise<Flavor> {
    return this.hookahDbService.getFlavorBySlug(slug);
  }
}
