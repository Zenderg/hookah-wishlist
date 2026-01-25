# Testing Strategies

## Overview

This document outlines comprehensive testing strategies for the Hookah Wishlist application, covering backend (NestJS), frontend (Angular), and Telegram bot integration (Telegraf).

## Testing Philosophy

- **Test what you build**: Focus on testing project-specific logic, not third-party libraries
- **Mock external dependencies**: Use mocks for Telegram API, hookah-db API, and database
- **Test isolation**: Each test should be independent and not rely on other tests
- **Fast feedback**: Unit tests should run quickly; integration/E2E tests can be slower
- **Coverage goal**: Aim for 80%+ code coverage for critical paths

## Backend Testing (NestJS)

### Unit Tests

**Purpose**: Test individual classes and methods in isolation

**Tools**: Jest, NestJS Testing Utilities

**What to Test**:
- Service business logic (WishlistService, AuthService)
- Controller request handling (with mocked services)
- Bot command handlers (with mocked Telegraf context)
- Validation decorators (class-validator)
- Error handling

**Example: Testing WishlistService**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WishlistService } from './wishlist.service';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Repository } from 'typeorm';

describe('WishlistService', () => {
  let service: WishlistService;
  let repository: Repository<WishlistItem>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getRepositoryToken(WishlistItem),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    repository = module.get<Repository<WishlistItem>>(
      getRepositoryToken(WishlistItem),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add item to wishlist', async () => {
    const userId = 123;
    const tobaccoId = 'test-tobacco-1';
    const tobaccoName = 'Test Tobacco';

    jest.spyOn(repository, 'save').mockResolvedValue({
      id: 1,
      userId,
      tobaccoId,
      tobaccoName,
    } as WishlistItem);

    const result = await service.addToWishlist(userId, tobaccoId, tobaccoName);

    expect(repository.save).toHaveBeenCalledWith({
      userId,
      tobaccoId,
      tobaccoName,
    });
    expect(result).toBeDefined();
  });
});
```

**Example: Testing Bot Command Handler with Mocked Telegraf Context**

```typescript
import { Context } from 'telegraf';
import { WishlistHandler } from './wishlist.handler';

// Mock Telegraf Context factory
function createMockContext(telegramId: number, text: string): Context {
  const mockCtx = {
    message: {
      chat: { id: telegramId },
      from: { id: telegramId, username: 'testuser' },
      text,
    },
    reply: jest.fn().mockResolvedValue({}),
  } as unknown as Context;

  return mockCtx;
}

describe('WishlistHandler', () => {
  let handler: WishlistHandler;
  let wishlistService: WishlistService;

  beforeEach(() => {
    wishlistService = {
      getUserWishlist: jest.fn(),
    } as unknown as WishlistService;

    handler = new WishlistHandler(wishlistService);
  });

  it('should display user wishlist', async () => {
    const telegramId = 123456;
    const mockWishlist = [
      { id: 1, tobaccoName: 'Sarma - Зима' },
      { id: 2, tobaccoName: 'Darkside - Mint' },
    ];

    jest.spyOn(wishlistService, 'getUserWishlist')
      .mockResolvedValue(mockWishlist);

    const ctx = createMockContext(telegramId, '/wishlist');
    await handler.handle(ctx);

    expect(wishlistService.getUserWishlist).toHaveBeenCalledWith(telegramId);
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Sarma - Зима')
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Darkside - Mint')
    );
  });
});
```

### Integration Tests

**Purpose**: Test module configuration and interaction between components

**Tools**: NestJS Testing Modules, in-memory SQLite

**What to Test**:
- Module initialization (imports, providers)
- Database operations (with in-memory SQLite)
- Controller-Service integration
- Bot-Service integration

**Example: Testing Wishlist Module**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistModule } from './wishlist.module';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

describe('WishlistModule (Integration)', () => {
  let module: TestingModule;
  let controller: WishlistController;
  let service: WishlistService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [WishlistItem],
          synchronize: true,
        }),
        WishlistModule,
      ],
    }).compile();

    controller = module.get<WishlistController>(WishlistController);
    service = module.get<WishlistService>(WishlistService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should add and retrieve wishlist item', async () => {
    const userId = 123;
    const tobaccoId = 'test-tobacco';
    const tobaccoName = 'Test Tobacco';

    await service.addToWishlist(userId, tobaccoId, tobaccoName);
    const wishlist = await service.getUserWishlist(userId);

    expect(wishlist).toHaveLength(1);
    expect(wishlist[0].tobaccoName).toBe(tobaccoName);
  });
});
```

### End-to-End Tests

**Purpose**: Test API endpoints as they would be called by clients

**Tools**: Supertest, NestJS Testing Utilities

**What to Test**:
- HTTP request/response handling
- Authentication flow
- Error responses
- Request validation

**Example: Testing Wishlist API Endpoints**

```typescript
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Wishlist API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Get auth token
    const response = await request(app.getHttpServer())
      .post('/api/auth/validate')
      .send({
        telegramId: 123456,
        username: 'testuser',
      });

    authToken = response.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/wishlist should return user wishlist', () => {
    return request(app.getHttpServer())
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('POST /api/wishlist should add item', () => {
    return request(app.getHttpServer())
      .post('/api/wishlist')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tobaccoId: 'test-tobacco-1',
        tobaccoName: 'Test Tobacco',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.tobaccoName).toBe('Test Tobacco');
      });
  });

  it('DELETE /api/wishlist/:id should remove item', () => {
    return request(app.getHttpServer())
      .delete('/api/wishlist/1')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
```

## Frontend Testing (Angular)

### Unit Tests

**Purpose**: Test components and services in isolation

**Tools**: Jasmine, Karma, Angular Testing Utilities

**What to Test**:
- Component rendering and interaction
- Service methods
- Pipes and directives
- Form validation

**Example: Testing Wishlist Component**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { WishlistComponent } from './wishlist.component';
import { WishlistService } from '../services/wishlist.service';

describe('WishlistComponent', () => {
  let component: WishlistComponent;
  let fixture: ComponentFixture<WishlistComponent>;
  let wishlistService: jasmine.SpyObj<WishlistService>;

  beforeEach(() => {
    const wishlistServiceSpy = jasmine.createSpyObj('WishlistService', [
      'getWishlist',
      'removeFromWishlist',
    ]);

    TestBed.configureTestingModule({
      declarations: [WishlistComponent],
      providers: [
        { provide: WishlistService, useValue: wishlistServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(WishlistComponent);
    component = fixture.componentInstance;
    wishlistService = wishlistServiceSpy;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should load wishlist on init', async () => {
    const mockWishlist = [
      { id: 1, tobaccoName: 'Sarma - Зима' },
      { id: 2, tobaccoName: 'Darkside - Mint' },
    ];

    wishlistService.getWishlist.and.returnValue(of(mockWishlist));
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.wishlist).toEqual(mockWishlist);
    const items = fixture.debugElement.queryAll(By.css('.wishlist-item'));
    expect(items.length).toBe(2);
  });

  it('should remove item from wishlist', () => {
    wishlistService.removeFromWishlist.and.returnValue(of(undefined));
    component.removeFromWishlist(1);

    expect(wishlistService.removeFromWishlist).toHaveBeenCalledWith(1);
  });
});
```

**Example: Testing Hookah-DB Service**

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HookahDbService } from './hookah-db.service';

describe('HookahDbService', () => {
  let service: HookahDbService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HookahDbService],
    });

    service = TestBed.inject(HookahDbService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get brands', () => {
    const mockBrands = [
      { name: 'Sarma', slug: 'sarma' },
      { name: 'Darkside', slug: 'darkside' },
    ];

    service.getBrands().subscribe((brands) => {
      expect(brands).toEqual(mockBrands);
    });

    const req = httpMock.expectOne(
      (req) => req.url.includes('/api/v1/brands')
    );
    expect(req.request.headers.get('X-API-Key')).toBe('test-api-key');
    req.flush(mockBrands);
  });

  it('should search flavors', () => {
    const mockFlavors = [
      { name: 'Зима', slug: 'zima', brand: 'Sarma' },
    ];

    service.searchFlavors('Зима').subscribe((flavors) => {
      expect(flavors).toEqual(mockFlavors);
    });

    const req = httpMock.expectOne(
      (req) => req.url.includes('/api/v1/flavors') &&
              req.params.get('search') === 'Зима'
    );
    req.flush(mockFlavors);
  });
});
```

### Integration Tests

**Purpose**: Test component-service interaction

**Tools**: Angular Testing Utilities with real services (mocked HTTP)

**What to Test**:
- Component initialization with service data
- User interactions triggering service calls
- Error handling in components

### End-to-End Tests

**Purpose**: Test user flows through the application

**Tools**: Playwright, Cypress (or Protractor for older Angular versions)

**What to Test**:
- Complete user journeys (search → add to wishlist → view wishlist)
- Navigation between pages
- Form submissions
- Error scenarios

**Example: E2E Test with Playwright**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Wishlist Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Telegram WebApp initialization
    await page.addInitScript(() => {
      window.Telegram = {
        WebApp: {
          initData: 'mock_init_data',
          initDataUnsafe: { user: { id: 123456, username: 'testuser' } },
          expand: () => {},
          ready: () => {},
        },
      };
    });

    await page.goto('/');
  });

  test('should search and add tobacco to wishlist', async ({ page }) => {
    // Search for tobacco
    await page.fill('input[placeholder="Search tobaccos..."]', 'Sarma');
    await page.click('button:has-text("Search")');

    // Wait for results
    await expect(page.locator('.tobacco-item')).toHaveCount(1);

    // Add to wishlist
    await page.click('button:has-text("Add to Wishlist")');

    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should view wishlist', async ({ page }) => {
    await page.click('a:has-text("My Wishlist")');

    // Wait for wishlist to load
    await expect(page.locator('.wishlist-item')).toBeVisible();
  });
});
```

## Telegram Bot Testing

### Mocking Telegram Context

Since we don't want to rely on the actual Telegram server during tests, we create mock Telegraf contexts.

**Key Principles**:
- Mock `ctx.reply()` to capture messages without sending to Telegram
- Mock `ctx.message` to simulate user input
- Mock `ctx.from` to provide user data
- Test command logic in isolation

**Mock Context Factory**:

```typescript
// src/bot/testing/mock-telegraf-context.ts
import { Context } from 'telegraf';

export interface MockContextOptions {
  telegramId?: number;
  username?: string;
  text?: string;
  chatId?: number;
}

export function createMockContext(options: MockContextOptions = {}): Context {
  const {
    telegramId = 123456,
    username = 'testuser',
    text = '/test',
    chatId = 123456,
  } = options;

  const replies: Array<{ message: string; extra?: any }> = [];

  const mockCtx = {
    message: {
      chat: { id: chatId },
      from: { id: telegramId, username },
      text,
    },
    from: { id: telegramId, username },
    chat: { id: chatId },
    reply: jest.fn().mockImplementation((message, extra) => {
      replies.push({ message, extra });
      return Promise.resolve({ message_id: 1 });
    }),
    getReplies: () => replies,
  } as unknown as Context;

  return mockCtx;
}
```

### Testing Bot Commands

**Example: Testing Start Command**

```typescript
import { StartHandler } from './start.handler';
import { createMockContext } from '../testing/mock-telegraf-context';

describe('StartHandler', () => {
  let handler: StartHandler;

  beforeEach(() => {
    handler = new StartHandler();
  });

  it('should welcome new user', async () => {
    const ctx = createMockContext({
      telegramId: 123456,
      username: 'newuser',
      text: '/start',
    });

    await handler.handle(ctx);

    const replies = (ctx as any).getReplies();
    expect(replies).toHaveLength(1);
    expect(replies[0].message).toContain('Welcome');
    expect(replies[0].message).toContain('/help');
  });
});
```

### Testing Bot-Service Integration

**Example: Testing Bot Service with Mocked Handlers**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BotService } from './bot.service';
import { BotModule } from './bot.module';
import { createMockContext } from './testing/mock-telegraf-context';

describe('BotService', () => {
  let service: BotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BotModule],
    }).compile();

    service = module.get<BotService>(BotService);
  });

  it('should handle /start command', async () => {
    const ctx = createMockContext({ text: '/start' });
    await service.handleUpdate(ctx);

    const replies = (ctx as any).getReplies();
    expect(replies.length).toBeGreaterThan(0);
  });

  it('should handle /wishlist command', async () => {
    const ctx = createMockContext({
      telegramId: 123456,
      text: '/wishlist',
    });

    await service.handleUpdate(ctx);

    const replies = (ctx as any).getReplies();
    expect(replies.length).toBeGreaterThan(0);
  });
});
```

## Integration Testing with External APIs

### Mocking hookah-db API

Since hookah-db is an external service, we should mock it in tests.

**Example: NestJS Service Mock**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('TobaccoService', () => {
  let service: TobaccoService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TobaccoService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(of({ data: [] })),
          },
        },
      ],
    }).compile();

    service = module.get<TobaccoService>(TobaccoService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should fetch brands from hookah-db', async () => {
    const mockBrands = [
      { name: 'Sarma', slug: 'sarma' },
    ];

    jest.spyOn(httpService, 'get')
      .mockReturnValue(of({ data: mockBrands, status: 200 }));

    const brands = await service.getBrands();

    expect(httpService.get).toHaveBeenCalledWith(
      expect.stringContaining('hdb.coolify.dknas.org')
    );
    expect(brands).toEqual(mockBrands);
  });
});
```

## Test Organization

### Directory Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.spec.ts
│   │   └── auth.service.spec.ts
│   ├── wishlist/
│   │   ├── wishlist.controller.spec.ts
│   │   ├── wishlist.service.spec.ts
│   │   └── entities/
│   │       └── wishlist-item.entity.spec.ts
│   └── bot/
│       ├── bot.service.spec.ts
│       ├── handlers/
│       │   ├── start.handler.spec.ts
│       │   ├── help.handler.spec.ts
│       │   └── wishlist.handler.spec.ts
│       └── testing/
│           └── mock-telegraf-context.ts
├── test/
│   └── app.e2e-spec.ts
└── jest.config.js

frontend/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── wishlist.service.spec.ts
│   │   │   └── hookah-db.service.spec.ts
│   │   └── components/
│   │       ├── search/
│   │       │   └── search.component.spec.ts
│   │       └── wishlist/
│   │           └── wishlist.component.spec.ts
├── e2e/
│   └── app.e2e-spec.ts
└── karma.conf.js
```

## Running Tests

### Backend

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Run E2E tests only
npm run test:e2e
```

### Frontend

```bash
# Run unit tests
ng test

# Run in watch mode
ng test --watch

# Run with coverage
ng test --code-coverage

# Run E2E tests
ng e2e
```

## Test Coverage Goals

- **Backend**: 80%+ coverage for services and controllers
- **Frontend**: 75%+ coverage for components and services
- **Critical paths**: 90%+ coverage (auth, wishlist CRUD, bot commands)
