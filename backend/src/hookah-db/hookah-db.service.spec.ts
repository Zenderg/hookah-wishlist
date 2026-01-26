import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { HookahDbService, Brand, Flavor } from './hookah-db.service';

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

  describe('getBrands', () => {
    const mockBrands: Brand[] = [
      { name: 'Al Fakher', slug: 'al-fakher' },
      { name: 'Starbuzz', slug: 'starbuzz' },
    ];

    it('should return brands without search parameter', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockBrands,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrands();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/api/v1/brands',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {},
        },
      );
      expect(result).toEqual(mockBrands);
    });

    it('should return brands with search parameter', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: [mockBrands[0]],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrands('al');

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/api/v1/brands',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { search: 'al' },
        },
      );
      expect(result).toEqual([mockBrands[0]]);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getBrands()).rejects.toThrow(axiosError);
    });
  });

  describe('getBrandBySlug', () => {
    const mockBrand: Brand = { name: 'Al Fakher', slug: 'al-fakher' };

    it('should return brand by slug', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockBrand,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getBrandBySlug('al-fakher');

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/api/v1/brands/al-fakher',
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

      await expect(service.getBrandBySlug('unknown')).rejects.toThrow(
        axiosError,
      );
    });
  });

  describe('getFlavors', () => {
    const mockFlavors: Flavor[] = [
      { name: 'Mint', slug: 'mint', brand: 'al-fakher' },
      { name: 'Blue Mist', slug: 'blue-mist', brand: 'starbuzz' },
    ];

    it('should return flavors without parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockFlavors,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getFlavors();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/api/v1/flavors',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: {},
        },
      );
      expect(result).toEqual(mockFlavors);
    });

    it('should return flavors with search parameter', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: [mockFlavors[0]],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getFlavors('mint');

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/api/v1/flavors',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { search: 'mint' },
        },
      );
      expect(result).toEqual([mockFlavors[0]]);
    });

    it('should return flavors with brand parameter', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: [mockFlavors[0]],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getFlavors(undefined, 'al-fakher');

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/api/v1/flavors',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { brand: 'al-fakher' },
        },
      );
      expect(result).toEqual([mockFlavors[0]]);
    });

    it('should return flavors with both search and brand parameters', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: [mockFlavors[0]],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getFlavors('mint', 'al-fakher');

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/api/v1/flavors',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
          params: { search: 'mint', brand: 'al-fakher' },
        },
      );
      expect(result).toEqual([mockFlavors[0]]);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getFlavors()).rejects.toThrow(axiosError);
    });
  });

  describe('getFlavorBySlug', () => {
    const mockFlavor: Flavor = {
      name: 'Mint',
      slug: 'mint',
      brand: 'al-fakher',
    };

    it('should return flavor by slug', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockFlavor,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const result = await service.getFlavorBySlug('mint');

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://hdb.coolify.dknas.org/api/v1/flavors/mint',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockFlavor);
    });

    it('should throw error when API call fails', async () => {
      const axiosError = new AxiosError('Flavor not found');
      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getFlavorBySlug('unknown')).rejects.toThrow(
        axiosError,
      );
    });
  });
});
