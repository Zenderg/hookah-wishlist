# API Specification

## Overview

This document describes the REST API endpoints for the Hookah Wishlist System. The API is built with Fastify and follows RESTful conventions. All endpoints return JSON responses and use standard HTTP status codes.

## Base URL

```
https://api.yourdomain.com/api/v1
```

## Authentication

### Telegram Bot Authentication

The Telegram Bot authenticates using a shared secret API key passed in the `X-API-Key` header.

```
X-API-Key: your-secret-api-key
```

### Mini App Authentication

The Mini App uses Telegram initData for initial authentication and receives a JWT token for subsequent requests.

**Initial Authentication**:
```http
POST /api/v1/auth/telegram
Content-Type: application/json

{
  "initData": "user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%7D&auth_date=1234567890&hash=..."
}
```

**Subsequent Requests**:
```http
Authorization: Bearer <jwt-token>
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## API Endpoints

### Authentication

#### Validate Telegram initData

Validates Telegram initData and returns a JWT token.

**Endpoint**: `POST /auth/telegram`

**Authentication**: None (public)

**Request Body**:
```json
{
  "initData": "string (required)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123,
      "telegramId": 123456789,
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "languageCode": "en"
    }
  },
  "error": null
}
```

**Error Responses**:
- `400` - Invalid initData format
- `401` - Invalid or expired initData

---

### Users

#### Get Current User

Get the authenticated user's information.

**Endpoint**: `GET /users/me`

**Authentication**: Bearer Token (Mini App) or API Key (Bot)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "telegramId": 123456789,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "languageCode": "en",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

### Tobaccos

#### Search Tobaccos

Search for tobaccos by name or brand.

**Endpoint**: `GET /tobaccos`

**Authentication**: Bearer Token or API Key

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search query (searches name and brand) |
| `brand` | string | No | Filter by brand slug |
| `limit` | integer | No | Maximum results (default: 50, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tobaccos": [
      {
        "id": 1,
        "name": "Зима",
        "slug": "zima",
        "description": "Холодный мятный вкус",
        "imageUrl": "https://htreviews.org/images/tobaccos/sarma/zima.jpg",
        "brand": {
          "id": 1,
          "name": "Sarma",
          "slug": "sarma"
        },
        "htreviewsUrl": "https://htreviews.org/tobaccos/sarma/klassicheskaya/zima"
      }
    ],
    "total": 42,
    "limit": 50,
    "offset": 0
  },
  "error": null
}
```

#### Get Tobacco by ID

Get detailed information about a specific tobacco.

**Endpoint**: `GET /tobaccos/:id`

**Authentication**: Bearer Token or API Key

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Зима",
    "slug": "zima",
    "description": "Холодный мятный вкус с долгим послевкусием",
    "imageUrl": "https://htreviews.org/images/tobaccos/sarma/zima.jpg",
    "brand": {
      "id": 1,
      "name": "Sarma",
      "slug": "sarma",
      "htreviewsUrl": "https://htreviews.org/tobaccos/sarma"
    },
    "htreviewsUrl": "https://htreviews.org/tobaccos/sarma/klassicheskaya/zima",
    "metadata": {
      "strength": "medium",
      "cut": "jungle",
      "flavorProfile": ["mint", "cold"],
      "rating": 4.5,
      "reviewsCount": 42
    },
    "scrapedAt": "2025-01-01T02:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

**Error Responses**:
- `404` - Tobacco not found

---

### Brands

#### List Brands

Get a list of all tobacco brands.

**Endpoint**: `GET /brands`

**Authentication**: Bearer Token or API Key

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Maximum results (default: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "brands": [
      {
        "id": 1,
        "name": "Sarma",
        "slug": "sarma",
        "htreviewsUrl": "https://htreviews.org/tobaccos/sarma"
      }
    ],
    "total": 25,
    "limit": 100,
    "offset": 0
  },
  "error": null
}
```

#### Get Brand by Slug

Get detailed information about a specific brand and its tobaccos.

**Endpoint**: `GET /brands/:slug`

**Authentication**: Bearer Token or API Key

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sarma",
    "slug": "sarma",
    "htreviewsUrl": "https://htreviews.org/tobaccos/sarma",
    "tobaccos": [
      {
        "id": 1,
        "name": "Зима",
        "slug": "zima",
        "imageUrl": "https://htreviews.org/images/tobaccos/sarma/zima.jpg"
      }
    ]
  },
  "error": null
}
```

**Error Responses**:
- `404` - Brand not found

---

### Wishlists

#### Get User's Wishlist

Get the authenticated user's wishlist items.

**Endpoint**: `GET /wishlist`

**Authentication**: Bearer Token (Mini App) or API Key (Bot with userId param)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | bigint | No | User ID (required for Bot authentication) |
| `includePurchased` | boolean | No | Include purchased items (default: false) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "My Wishlist",
    "items": [
      {
        "id": 1,
        "isPurchased": false,
        "purchasedAt": null,
        "createdAt": "2025-01-01T10:00:00Z",
        "tobacco": {
          "id": 1,
          "name": "Зима",
          "slug": "zima",
          "imageUrl": "https://htreviews.org/images/tobaccos/sarma/zima.jpg",
          "brand": {
            "id": 1,
            "name": "Sarma",
            "slug": "sarma"
          }
        },
        "customName": null,
        "customBrand": null
      },
      {
        "id": 2,
        "isPurchased": false,
        "purchasedAt": null,
        "createdAt": "2025-01-01T11:00:00Z",
        "tobacco": null,
        "customName": "Custom Tobacco",
        "customBrand": "Custom Brand"
      }
    ]
  },
  "error": null
}
```

#### Add Item to Wishlist

Add a tobacco (from database or custom) to the user's wishlist.

**Endpoint**: `POST /wishlist/items`

**Authentication**: Bearer Token or API Key

**Request Body** (for database tobacco):
```json
{
  "tobaccoId": 1
}
```

**Request Body** (for custom tobacco):
```json
{
  "customName": "Custom Tobacco",
  "customBrand": "Custom Brand"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "isPurchased": false,
    "purchasedAt": null,
    "createdAt": "2025-01-01T12:00:00Z",
    "tobacco": {
      "id": 1,
      "name": "Зима",
      "slug": "zima",
      "imageUrl": "https://htreviews.org/images/tobaccos/sarma/zima.jpg",
      "brand": {
        "id": 1,
        "name": "Sarma",
        "slug": "sarma"
      }
    },
    "customName": null,
    "customBrand": null
  },
  "error": null
}
```

**Error Responses**:
- `400` - Invalid request (neither tobaccoId nor customName provided)
- `404` - Tobacco not found (if tobaccoId provided)
- `409` - Item already in wishlist

#### Mark Item as Purchased

Mark a wishlist item as purchased.

**Endpoint**: `PATCH /wishlist/items/:id/purchased`

**Authentication**: Bearer Token or API Key

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isPurchased": true,
    "purchasedAt": "2025-01-01T13:00:00Z",
    "createdAt": "2025-01-01T10:00:00Z",
    "tobacco": { ... },
    "customName": null,
    "customBrand": null
  },
  "error": null
}
```

**Error Responses**:
- `404` - Item not found

#### Remove Item from Wishlist

Remove an item from the user's wishlist.

**Endpoint**: `DELETE /wishlist/items/:id`

**Authentication**: Bearer Token or API Key

**Response** (204 No Content)

**Error Responses**:
- `404` - Item not found

#### Clear Purchased Items

Remove all purchased items from the wishlist.

**Endpoint**: `DELETE /wishlist/purchased`

**Authentication**: Bearer Token or API Key

**Response** (204 No Content)

---

### Bot Endpoints

These endpoints are specifically designed for the Telegram Bot to format responses.

#### Get Wishlist as Text

Get the user's wishlist formatted as plain text for bot messages.

**Endpoint**: `GET /bot/wishlist/text`

**Authentication**: API Key

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | bigint | Yes | User Telegram ID |
| `includePurchased` | boolean | No | Include purchased items (default: false) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "text": "📋 Ваш список покупок:\n\n1. Sarma - Зима\n2. Custom Brand - Custom Tobacco\n\nВсего: 2 товара"
  },
  "error": null
}
```

#### Get Wishlist Summary

Get a summary of the user's wishlist for quick bot responses.

**Endpoint**: `GET /bot/wishlist/summary`

**Authentication**: API Key

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | bigint | Yes | User Telegram ID |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalItems": 5,
    "purchasedItems": 2,
    "activeItems": 3,
    "recentItems": [
      {
        "brand": "Sarma",
        "name": "Зима"
      }
    ]
  },
  "error": null
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_FAILED` | Invalid or missing authentication |
| `AUTHORIZATION_FAILED` | User not authorized for this action |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_CONFLICT` | Resource already exists or conflicts with existing data |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Internal server error |

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 10 requests | 1 minute |
| Search endpoints | 100 requests | 1 minute |
| Wishlist endpoints | 50 requests | 1 minute |
| Bot endpoints | 100 requests | 1 minute |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Validation Rules

### Tobacco Search
- `search`: max 100 characters
- `brand`: max 50 characters, alphanumeric and hyphens only
- `limit`: 1-100
- `offset`: >= 0

### Wishlist Item
- `tobaccoId`: must exist in database
- `customName`: required if tobaccoId not provided, max 255 characters
- `customBrand`: optional, max 255 characters

## Pagination

List endpoints support pagination using `limit` and `offset` parameters.

**Request**:
```
GET /tobaccos?limit=20&offset=40
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150,
    "limit": 20,
    "offset": 40
  },
  "error": null
}
```

## Filtering

### Tobaccos

**By brand**:
```
GET /tobaccos?brand=sarma
```

**By search term**:
```
GET /tobaccos?search=зима
```

**Combined filters**:
```
GET /tobaccos?brand=sarma&search=зима&limit=10
```

### Wishlist

**Include purchased items**:
```
GET /wishlist?includePurchased=true
```

## Sorting

Default sorting:
- Tobaccos: by brand name, then tobacco name
- Wishlist items: by creation date (newest first)

Future enhancement: Add `sort` parameter for custom sorting.

## CORS Configuration

Allowed origins:
- `https://t.me/*` (Telegram Mini Apps)
- `https://web.telegram.org/*` (Telegram Web)

Allowed methods:
- GET, POST, PATCH, DELETE, OPTIONS

Allowed headers:
- Content-Type, Authorization, X-API-Key

## SDK Examples

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.yourdomain.com/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Search tobaccos
const searchTobaccos = async (query) => {
  const response = await api.get('/tobaccos', { params: { search: query } });
  return response.data.data.tobaccos;
};

// Get wishlist
const getWishlist = async () => {
  const response = await api.get('/wishlist');
  return response.data.data;
};

// Add item to wishlist
const addToWishlist = async (tobaccoId) => {
  const response = await api.post('/wishlist/items', { tobaccoId });
  return response.data.data;
};
```

### TypeScript

```typescript
interface Tobacco {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  brand: {
    id: number;
    name: string;
    slug: string;
  };
}

interface WishlistItem {
  id: number;
  isPurchased: boolean;
  tobacco: Tobacco | null;
  customName: string | null;
  customBrand: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: null;
}

const api = axios.create({
  baseURL: 'https://api.yourdomain.com/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const searchTobaccos = async (query: string): Promise<Tobacco[]> => {
  const response = await api.get<ApiResponse<{ tobaccos: Tobacco[] }>>('/tobaccos', {
    params: { search: query }
  });
  return response.data.data.tobaccos;
};
```

## Summary

The API provides:

✅ **RESTful design** - Clean, predictable endpoint structure
✅ **JWT authentication** - Secure token-based authentication
✅ **Comprehensive endpoints** - Full CRUD operations for all resources
✅ **Bot-specific endpoints** - Formatted responses for Telegram bot
✅ **Pagination & filtering** - Efficient data retrieval
✅ **Error handling** - Consistent error responses
✅ **Rate limiting** - Protection against abuse
✅ **Type safety** - TypeScript support
✅ **Documentation** - Clear examples and specifications

The API is designed to support both the Telegram Bot and Mini App with appropriate authentication methods and response formats.
