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

### Integration Tests

**Purpose**: Test module configuration and interaction between components

**Tools**: NestJS Testing Modules, in-memory SQLite

**What to Test**:
- Module initialization (imports, providers)
- Database operations (with in-memory SQLite)
- Controller-Service integration
- Bot-Service integration

### End-to-End Tests

**Purpose**: Test API endpoints as they would be called by clients

**Tools**: Supertest, NestJS Testing Utilities

**What to Test**:
- HTTP request/response handling
- Authentication flow
- Error responses
- Request validation

## Frontend Testing (Angular)

### Unit Tests

**Purpose**: Test components and services in isolation

**Tools**: Vitest, jsdom, Angular Testing Utilities

**What to Test**:
- Component rendering and interaction
- Service methods
- Pipes and directives
- Form validation

### Integration Tests

**Purpose**: Test component-service interaction

**Tools**: Angular Testing Utilities with real services (mocked HTTP)

**What to Test**:
- Component initialization with service data
- User interactions triggering service calls
- Error handling in components

### End-to-End Tests

**Purpose**: Test user flows through the application

**Tools**: Playwright, Cypress

**What to Test**:
- Complete user journeys (search → add to wishlist → view wishlist)
- Navigation between pages
- Form submissions
- Error scenarios

## Telegram Bot Testing

### Mocking Telegram Context

Since we don't want to rely on the actual Telegram server during tests, we create mock Telegraf contexts.

**Key Principles**:
- Mock `ctx.reply()` to capture messages without sending to Telegram
- Mock `ctx.message` to simulate user input
- Mock `ctx.from` to provide user data
- Test command logic in isolation

### Testing Bot Commands

Test each bot command handler in isolation with mocked Telegram context.

### Testing Bot-Service Integration

Test that the BotService correctly delegates to the appropriate handlers.

## Integration Testing with External APIs

### Mocking hookah-db API

Since hookah-db is an external service, we should mock it in tests.

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
└── e2e/
    └── app.e2e-spec.ts
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
