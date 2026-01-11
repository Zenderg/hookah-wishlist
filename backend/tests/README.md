# Backend Test Suite Documentation

## Overview

The backend test suite provides comprehensive coverage for all core functionality of the hookah-wishlist backend service, including unit tests, integration tests, and mock utilities. The test suite ensures code quality, reliability, and maintainability through automated testing.

## Test Statistics

- **Total Tests**: 727
- **Passed**: 724 (99.59%)
- **Failed**: 3 (0.41%)
- **Test Suites**: 19 total (17 passed, 2 failed)
- **Coverage**: 90.99% statements, 89.13% branches, 88.23% functions, 90.84% lines

## Directory Structure

```
tests/
├── setup.ts                          # Jest setup file (runs before all tests)
├── fixtures/                         # Test fixtures and sample data
│   └── mockData.ts                   # Factory functions and sample data
├── mocks/                            # Mock implementations for external services
│   ├── mockAxios.ts                  # Axios HTTP client mock
│   ├── mockExpress.ts                # Express request/response mocks
│   └── mockTelegram.ts               # Telegram Bot API mocks
├── unit/                             # Unit tests
│   ├── bot/                          # Bot-related unit tests
│   │   ├── commands/                 # Bot command handler tests
│   │   │   ├── add.test.ts
│   │   │   ├── help.test.ts
│   │   │   ├── remove.test.ts
│   │   │   ├── search.test.ts
│   │   │   ├── start.test.ts
│   │   │   └── wishlist.test.ts
│   │   └── session.test.ts           # Session management tests
│   ├── controllers/                  # Controller unit tests
│   │   ├── search.controller.test.ts
│   │   └── wishlist.controller.test.ts
│   ├── middleware/                   # Middleware unit tests
│   │   ├── auth.test.ts
│   │   └── errorHandler.test.ts
│   ├── services/                     # Service layer unit tests
│   │   ├── hookah-db.service.test.ts
│   │   ├── search.service.test.ts
│   │   └── wishlist.service.test.ts
│   └── storage/                      # Storage layer unit tests
│       ├── file.storage.test.ts
│       └── sqlite.storage.test.ts
├── integration/                      # Integration tests
│   ├── api.test.ts                   # Full API integration tests
│   └── routes/                       # Route-specific integration tests
│       ├── search.test.ts
│       └── wishlist.test.ts
└── utils/                           # Test utilities and helpers
    ├── testDatabase.ts               # Database test helpers
    └── testHelpers.ts                # General test helper functions
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

Watch mode automatically re-runs tests when files change.

### Generate Coverage Report

```bash
npm run test:coverage
```

This generates:
- Console output with coverage statistics
- HTML report in `coverage/lcov-report/index.html`
- LCOV format report in `coverage/lcov.info`

### Run Specific Test File

```bash
npm test -- tests/unit/services/wishlist.service.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should add item"
```

### Run Tests in Verbose Mode

```bash
npm test -- --verbose
```

## Coverage Thresholds

The test suite enforces minimum coverage thresholds:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

Current coverage exceeds all thresholds:
- Statements: 90.99%
- Branches: 89.13%
- Functions: 88.23%
- Lines: 90.84%

## Test Utilities and Helpers

### Test Setup

The `setup.ts` file configures the test environment:

```typescript
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.STORAGE_TYPE = 'file';
process.env.STORAGE_PATH = './tests/data/test-storage.json';
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.HOOKEH_DB_API_URL = 'http://localhost:8080';
process.env.HOOKEH_DB_API_KEY = 'test-api-key';
```

### Mock Data Factories

Located in `fixtures/mockData.ts`:

- `createUser(overrides?)` - Create test user object
- `createWishlistItem(overrides?)` - Create test wishlist item
- `createWishlist(overrides?)` - Create test wishlist
- `createTobacco(overrides?)` - Create test tobacco object
- `createUsers(count, startId?)` - Create multiple users
- `createWishlists(count, startUserId?)` - Create multiple wishlists
- `createTobaccos(count, startId?)` - Create multiple tobaccos
- `getTobaccoById(id)` - Get tobacco from sample data
- `getWishlistByUserId(userId)` - Get wishlist from sample data
- `getUserById(id)` - Get user from sample data

### Test Helper Functions

Located in `utils/testHelpers.ts`:

- `generateTestId()` - Generate random test ID (number)
- `generateTestIdString()` - Generate random test ID (string)
- `generateTestString(prefix?, length?)` - Generate random test string
- `generateTestEmail()` - Generate random test email
- `generateTestDate(daysOffset?)` - Generate test date
- `generatePastDate(daysAgo?)` - Generate past date
- `generateFutureDate(daysFromNow?)` - Generate future date
- `generateTestTimestamp()` - Generate Unix timestamp
- `setupTestEnv()` - Setup test environment variables
- `resetTestEnv()` - Reset test environment variables
- `delay(ms)` - Create delay for async operations
- `waitFor(condition, timeout?, interval?)` - Wait for condition
- `mockResolvedValue(value)` - Create resolving mock function
- `mockRejectedValue(error)` - Create rejecting mock function
- `expectToReject(promise, errorMessage?)` - Assert promise rejection
- `expectToResolve(promise, expectedValue)` - Assert promise resolution
- `spyOnMethod(obj, method)` - Create spy on object method
- `withTestDatabase(callback)` - Setup/teardown test database
- `withTestEnv(callback)` - Setup/teardown test environment
- `createTestSuite(name, setupFn?, teardownFn?)` - Create test suite with setup/teardown

### Mock Objects

#### Axios Mock (`mocks/mockAxios.ts`)
- Mocks axios HTTP client
- Provides mock responses for API calls
- Simulates network errors
- Tracks request history

#### Express Mock (`mocks/mockExpress.ts`)
- Mocks Express request and response objects
- Provides mock `req` object with properties: `body`, `params`, `query`, `headers`
- Provides mock `res` object with methods: `status()`, `json()`, `send()`, `end()`
- Tracks response status and data

#### Telegram Mock (`mocks/mockTelegram.ts`)
- Mocks Telegram Bot API
- Provides mock bot instance
- Simulates bot commands and messages
- Tracks sent messages

## Test Categories

### Unit Tests

Unit tests test individual components in isolation:

1. **Bot Commands** (`unit/bot/commands/`)
   - Tests each bot command handler
   - Validates command registration
   - Tests message handling and responses
   - Tests error handling

2. **Controllers** (`unit/controllers/`)
   - Tests request handling
   - Validates response formatting
   - Tests error scenarios
   - Validates input validation

3. **Middleware** (`unit/middleware/`)
   - Tests authentication logic
   - Tests error handling
   - Tests request/response modification

4. **Services** (`unit/services/`)
   - Tests business logic
   - Tests data transformations
   - Tests error handling
   - Tests external API integration

5. **Storage** (`unit/storage/`)
   - Tests data persistence
   - Tests CRUD operations
   - Tests error handling
   - Tests caching behavior

### Integration Tests

Integration tests test multiple components working together:

1. **API Integration** (`integration/api.test.ts`)
   - Tests full request/response cycles
   - Tests authentication across endpoints
   - Tests error handling across layers
   - Tests concurrent requests

2. **Route Integration** (`integration/routes/`)
   - Tests complete route handlers
   - Tests middleware integration
   - Tests database integration
   - Tests API contract compliance

## Test Best Practices

### 1. Test Structure

Each test file should follow this structure:

```typescript
describe('ComponentName', () => {
  describe('Feature Group', () => {
    beforeEach(() => {
      // Setup before each test
    });

    afterEach(() => {
      // Cleanup after each test
    });

    it('should do something specific', () => {
      // Arrange
      const input = createTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### 2. Naming Conventions

- Test files: `*.test.ts`
- Describe blocks: Use component name
- Test cases: Use "should" format
- Example: `should return 401 when missing initData`

### 3. Test Isolation

- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/teardown
- Clear mocks between tests
- Use unique test data for each test

### 4. Mock Usage

- Mock external dependencies (API calls, databases)
- Don't mock the code being tested
- Verify mock calls when appropriate
- Clear mocks after each test

### 5. Error Testing

- Test both success and error paths
- Test edge cases and boundary conditions
- Test invalid inputs
- Test network failures

### 6. Async Testing

- Use `async/await` for async tests
- Handle promise rejections
- Use proper timeouts (default: 10s)
- Test concurrent operations

## Configuration

### Jest Configuration

Located in `jest.config.js`:

```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true
}
```

### TypeScript Configuration

Tests use the same TypeScript configuration as the source code:
- Strict mode enabled
- Target: ES2020
- Module resolution: Node
- Path aliases: `@/` for src directory

## Troubleshooting

### Common Issues

1. **Test Timeout Increase**
   ```bash
   npm test -- --testTimeout=20000
   ```

2. **Run Specific Test Suite**
   ```bash
   npm test -- tests/unit/services/
   ```

3. **Debug Tests**
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

4. **Clear Jest Cache**
   ```bash
   npm test -- --clearCache
   ```

5. **Update Snapshots**
   ```bash
   npm test -- -u
   ```

## Adding New Tests

### Steps to Add a New Test

1. Create test file in appropriate directory
2. Import necessary dependencies and mocks
3. Write test cases following best practices
4. Run tests to verify
5. Check coverage report
6. Commit with descriptive message

### Example Test

```typescript
import { WishlistService } from '@/services/wishlist.service';
import { createWishlist, createWishlistItem } from '../fixtures/mockData';

describe('WishlistService', () => {
  let service: WishlistService;

  beforeEach(() => {
    service = new WishlistService();
  });

  describe('addItem', () => {
    it('should add item to wishlist', async () => {
      const userId = 123456789;
      const item = createWishlistItem({ tobaccoId: '1' });

      await service.addItem(userId, item.tobaccoId, item.notes);

      const wishlist = await service.getWishlist(userId);
      expect(wishlist?.items).toContainEqual(item);
    });
  });
});
```

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```bash
# Run tests with coverage
npm run test:coverage

# Check if coverage meets thresholds
npm test -- --coverage --coverageReporters=text
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices)
