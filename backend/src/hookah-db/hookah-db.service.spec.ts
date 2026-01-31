import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import {
  HookahDbService,
  Brand,
  Tobacco,
  Line,
  PaginatedResponse,
} from './hookah-db.service';

describe('HookahDbService', () => {
  let service: HookahDbService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockBrand: Brand = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Al Fakher',
    slug: 'al-fakher',
    country: 'Egypt',
    rating: 4.5,
    ratingsCount: 100,
    description: 'Test description',
    logoUrl: 'https://example.com/logo.png',
    status: 'Выпускается',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTobacco: Tobacco = {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'Mint',
    slug: 'mint',
    brandId: '550e8400-e29b-41d4-a716-446655440000',
    lineId: '770e8400-e29b-41d4-a716-446655440002',
    rating: 4.7,
    ratingsCount: 50,
    strengthOfficial: 'Medium',
    strengthByRatings: 'Medium',
    status: 'Выпускается',
    htreviewsId: '12345',
    imageUrl: 'https://example.com/tobacco.png',
    description: 'Test tobacco description',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockLine: Line = {
    id: '770e8400-e29b-41d4-a716-446655440002',
    name: 'Classic',
    slug: 'classic',
    brandId: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Test line description',
    imageUrl: 'https://example.com/line.png',
    rating: 4.6,
    ratingsCount: 30,
    strengthOfficial: 'Medium',
    strengthByRatings: 'Medium',
    status: 'Выпускается',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPaginatedBrands: PaginatedResponse<Brand> = {
    data: [mockBrand],
    page: 1,
    limit: 20,
    total: 1,
    pages: 1,
  };

  const mockPaginatedTobaccos: PaginatedResponse<Tobacco> = {
    data: [mockTobacco],
    page: 1,
    limit: 20,
    total: 1,
    pages: 1,
  };

  const mockPaginatedLines: PaginatedResponse<Line> = {
    data: [mockLine],
    page: 1,
    limit: 20,
    total: 1,
    pages: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HookahDbService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HookahDbService>(HookahDbService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'HOOKAH_DB_API_URL') {
        return 'https://hdb.coolify.dknas.org';
      }
      if (key === 'HOOKAH_DB_API_KEY') {
        return 'test-api-key';
      }
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: { status: 'ok' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.healthCheck();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/health',
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
      expect(result).toEqual({ status: 'ok' });
    });

    it('should throw error when health check fails', async () => {
      const axiosError = new AxiosError('Health check failed');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.healthCheck()).rejects.toThrow(axiosError);
    });
  });

  describe('getBrands', () => {
    it('should return paginated brands without parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedBrands,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrands();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/brands',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {},
        },
      );
      expect(result).toEqual(mockPaginatedBrands);
    });

    it('should return paginated brands with search parameter', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedBrands,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrands({ search: 'al' });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/brands',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { search: 'al' },
        },
      );
      expect(result).toEqual(mockPaginatedBrands);
    });

    it('should return paginated brands with all parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedBrands,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrands({
        page: 2,
        limit: 10,
        sortBy: 'name',
        order: 'asc',
        country: 'Egypt',
        status: 'Выпускается',
        search: 'al',
      });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/brands',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {
            page: '2',
            limit: '10',
            sortBy: 'name',
            order: 'asc',
            country: 'Egypt',
            status: 'Выпускается',
            search: 'al',
          },
        },
      );
      expect(result).toEqual(mockPaginatedBrands);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getBrands()).rejects.toThrow(axiosError);
    });
  });

  describe('getBrandById', () => {
    it('should return brand by UUID', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockBrand,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrandById(mockBrand.id);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `https://hdb.coolify.dknas.org/brands/${mockBrand.id}`,
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockBrand);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Brand not found');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getBrandById('unknown')).rejects.toThrow(axiosError);
    });
  });

  describe('getBrandTobaccos', () => {
    it('should return paginated tobaccos for brand', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedTobaccos,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrandTobaccos(mockBrand.id);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `https://hdb.coolify.dknas.org/brands/${mockBrand.id}/tobaccos`,
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {},
        },
      );
      expect(result).toEqual(mockPaginatedTobaccos);
    });

    it('should return paginated tobaccos for brand with parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedTobaccos,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrandTobaccos(mockBrand.id, {
        page: 1,
        limit: 10,
        sortBy: 'rating',
        order: 'desc',
      });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `https://hdb.coolify.dknas.org/brands/${mockBrand.id}/tobaccos`,
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { page: '1', limit: '10', sortBy: 'rating', order: 'desc' },
        },
      );
      expect(result).toEqual(mockPaginatedTobaccos);
    });
  });

  describe('getBrandCountries', () => {
    it('should return list of countries', async () => {
      const mockCountries = ['Egypt', 'USA', 'Russia'];
      mockHttpService.get.mockReturnValue(
        of({
          data: mockCountries,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrandCountries();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/brands/countries',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockCountries);
    });
  });

  describe('getBrandStatuses', () => {
    it('should return list of statuses', async () => {
      const mockStatuses = ['Выпускается', 'Лимитированная', 'Снята с производства'];
      mockHttpService.get.mockReturnValue(
        of({
          data: mockStatuses,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrandStatuses();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/brands/statuses',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockStatuses);
    });
  });

  describe('getTobaccos', () => {
    it('should return paginated tobaccos without parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedTobaccos,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getTobaccos();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/tobaccos',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {},
        },
      );
      expect(result).toEqual(mockPaginatedTobaccos);
    });

    it('should return paginated tobaccos with search parameter', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedTobaccos,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getTobaccos({ search: 'mint' });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/tobaccos',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { search: 'mint' },
        },
      );
      expect(result).toEqual(mockPaginatedTobaccos);
    });

    it('should return paginated tobaccos with all parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedTobaccos,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getTobaccos({
        page: 1,
        limit: 20,
        sortBy: 'rating',
        order: 'desc',
        brandId: mockBrand.id,
        lineId: mockLine.id,
        minRating: 4,
        maxRating: 5,
        country: 'Egypt',
        status: 'Выпускается',
        search: 'mint',
      });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/tobaccos',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {
            page: '1',
            limit: '20',
            sortBy: 'rating',
            order: 'desc',
            brandId: mockBrand.id,
            lineId: mockLine.id,
            minRating: '4',
            maxRating: '5',
            country: 'Egypt',
            status: 'Выпускается',
            search: 'mint',
          },
        },
      );
      expect(result).toEqual(mockPaginatedTobaccos);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getTobaccos()).rejects.toThrow(axiosError);
    });
  });

  describe('getTobaccoById', () => {
    it('should return tobacco by UUID', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockTobacco,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getTobaccoById(mockTobacco.id);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `https://hdb.coolify.dknas.org/tobaccos/${mockTobacco.id}`,
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockTobacco);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Tobacco not found');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getTobaccoById('unknown')).rejects.toThrow(axiosError);
    });
  });

  describe('getTobaccoStatuses', () => {
    it('should return list of statuses', async () => {
      const mockStatuses = ['Выпускается'];
      mockHttpService.get.mockReturnValue(
        of({
          data: mockStatuses,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getTobaccoStatuses();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/tobaccos/statuses',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockStatuses);
    });
  });

  describe('getLines', () => {
    it('should return paginated lines without parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedLines,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getLines();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/lines',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {},
        },
      );
      expect(result).toEqual(mockPaginatedLines);
    });

    it('should return paginated lines with search parameter', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedLines,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getLines({ search: 'classic' });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/lines',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { search: 'classic' },
        },
      );
      expect(result).toEqual(mockPaginatedLines);
    });

    it('should return paginated lines with brandId parameter', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedLines,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getLines({ brandId: mockBrand.id });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/lines',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { brandId: mockBrand.id },
        },
      );
      expect(result).toEqual(mockPaginatedLines);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getLines()).rejects.toThrow(axiosError);
    });
  });

  describe('getLineById', () => {
    it('should return line by UUID', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockLine,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getLineById(mockLine.id);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `https://hdb.coolify.dknas.org/lines/${mockLine.id}`,
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockLine);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Line not found');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getLineById('unknown')).rejects.toThrow(axiosError);
    });
  });

  describe('getLineTobaccos', () => {
    it('should return paginated tobaccos for line', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedTobaccos,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getLineTobaccos(mockLine.id);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `https://hdb.coolify.dknas.org/lines/${mockLine.id}/tobaccos`,
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {},
        },
      );
      expect(result).toEqual(mockPaginatedTobaccos);
    });

    it('should return paginated tobaccos for line with parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockPaginatedTobaccos,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getLineTobaccos(mockLine.id, {
        page: 1,
        limit: 10,
        sortBy: 'rating',
        order: 'desc',
      });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        `https://hdb.coolify.dknas.org/lines/${mockLine.id}/tobaccos`,
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { page: '1', limit: '10', sortBy: 'rating', order: 'desc' },
        },
      );
      expect(result).toEqual(mockPaginatedTobaccos);
    });
  });

  describe('getLineStatuses', () => {
    it('should return list of statuses', async () => {
      const mockStatuses = ['Выпускается', 'Лимитированная'];
      mockHttpService.get.mockReturnValue(
        of({
          data: mockStatuses,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getLineStatuses();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/lines/statuses',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockStatuses);
    });
  });

  describe('Legacy methods', () => {
    describe('getFlavors', () => {
      it('should return tobaccos (deprecated)', async () => {
        mockHttpService.get.mockReturnValue(
          of({
            data: mockPaginatedTobaccos,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
          }),
        );

        const result = await service.getFlavors('mint', mockBrand.id);

        expect(mockHttpService.get).toHaveBeenCalledWith(
          'https://hdb.coolify.dknas.org/tobaccos',
          {
            headers: {
              'X-API-Key': 'test-api-key',
              'Content-Type': 'application/json',
            },
            params: { search: 'mint', brandId: mockBrand.id },
          },
        );
        expect(result).toEqual([mockTobacco]);
      });
    });

    describe('getFlavorBySlug', () => {
      it('should throw error (deprecated)', async () => {
        await expect(service.getFlavorBySlug('mint')).rejects.toThrow(
          'getFlavorBySlug() is deprecated. Use getTobaccoById() with UUID instead.',
        );
      });
    });
  });
});
