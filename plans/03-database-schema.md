# Database Schema

## Overview

This document describes the database schema for the Hookah Wishlist System. The database is built on PostgreSQL 16+ and uses Prisma ORM for database operations. The schema is designed to support the core functionality of managing hookah tobacco wishlists while maintaining flexibility for future enhancements.

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Wishlist : has
    User ||--o{ WishlistItem : owns
    Tobacco ||--o{ WishlistItem : included_in
    Brand ||--o{ Tobacco : produces
    
    User {
        bigint id PK
        string telegram_id UK
        string username
        string first_name
        string last_name
        string language_code
        boolean is_bot
        datetime created_at
        datetime updated_at
    }
    
    Brand {
        int id PK
        string name UK
        string slug UK
        string htreviews_url
        datetime created_at
        datetime updated_at
    }
    
    Tobacco {
        int id PK
        string name
        string slug
        string description
        string image_url
        int brand_id FK
        string htreviews_url
        jsonb metadata
        datetime scraped_at
        datetime created_at
        datetime updated_at
        unique brand_id, slug
    }
    
    Wishlist {
        int id PK
        bigint user_id FK
        string name
        datetime created_at
        datetime updated_at
    }
    
    WishlistItem {
        int id PK
        int wishlist_id FK
        int tobacco_id FK
        string custom_name
        string custom_brand
        boolean is_purchased
        datetime purchased_at
        datetime created_at
        datetime updated_at
        unique wishlist_id, tobacco_id
        unique wishlist_id, custom_name
    }
```

## Tables

### 1. Users

Stores Telegram user information for authentication and personalization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PRIMARY KEY, AUTO INCREMENT | Internal user identifier |
| `telegram_id` | `bigint` | UNIQUE, NOT NULL | Telegram user ID from Telegram API |
| `username` | `varchar(255)` | NULLABLE | Telegram username (without @) |
| `first_name` | `varchar(255)` | NULLABLE | User's first name |
| `last_name` | `varchar(255)` | NULLABLE | User's last name |
| `language_code` | `char(2)` | NULLABLE | User's language code (e.g., 'en', 'ru') |
| `is_bot` | `boolean` | NOT NULL, DEFAULT false | Whether the user is a bot |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_users_telegram_id` on `telegram_id` (UNIQUE)

**Notes**:
- `telegram_id` is the primary identifier from Telegram
- User data is synchronized from Telegram on first interaction
- `username` can change over time (users can update their Telegram username)

### 2. Brands

Stores tobacco brand information scraped from htreviews.org.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Internal brand identifier |
| `name` | `varchar(255)` | UNIQUE, NOT NULL | Brand name (e.g., 'Sarma', 'Tangiers') |
| `slug` | `varchar(255)` | UNIQUE, NOT NULL | URL-friendly brand identifier |
| `htreviews_url` | `varchar(500)` | NULLABLE | URL to brand page on htreviews.org |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_brands_name` on `name` (UNIQUE)
- `idx_brands_slug` on `slug` (UNIQUE)

**Notes**:
- Brands are populated by the scraper from htreviews.org
- `slug` is derived from the URL path (e.g., 'sarma' from '/tobaccos/sarma')
- `htreviews_url` stores the source URL for reference

### 3. Tobaccos

Stores individual tobacco products with details scraped from htreviews.org.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Internal tobacco identifier |
| `name` | `varchar(255)` | NOT NULL | Tobacco name (e.g., 'Зима', 'Classic') |
| `slug` | `varchar(255)` | NOT NULL | URL-friendly tobacco identifier |
| `description` | `text` | NULLABLE | Tobacco description/review |
| `image_url` | `varchar(500)` | NULLABLE | Direct URL to tobacco image |
| `brand_id` | `integer` | NOT NULL, FOREIGN KEY | Reference to Brands table |
| `htreviews_url` | `varchar(500)` | NULLABLE | URL to tobacco page on htreviews.org |
| `metadata` | `jsonb` | NULLABLE | Additional scraped data (strength, cut, etc.) |
| `scraped_at` | `timestamp` | NULLABLE | Last scraping timestamp |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_tobaccos_brand_id` on `brand_id`
- `idx_tobaccos_name` on `name`
- `idx_tobaccos_slug` on `slug`
- `idx_tobaccos_brand_slug` on `brand_id, slug` (UNIQUE)

**Foreign Keys**:
- `brand_id` → `Brands.id` ON DELETE CASCADE

**Notes**:
- `image_url` is a direct link to htreviews.org, not stored locally
- `metadata` JSONB can store: strength, cut, flavor profile, etc.
- Unique constraint on `brand_id` + `slug` ensures no duplicates
- `scraped_at` tracks when the data was last updated from source

**Example `metadata` structure**:
```json
{
  "strength": "medium",
  "cut": "jungle",
  "flavor_profile": ["mint", "cold"],
  "rating": 4.5,
  "reviews_count": 42
}
```

### 4. Wishlists

Represents a user's wishlist collection (currently one per user, but schema allows multiple).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Internal wishlist identifier |
| `user_id` | `bigint` | NOT NULL, FOREIGN KEY | Reference to Users table |
| `name` | `varchar(255)` | NOT NULL, DEFAULT 'My Wishlist' | Wishlist name |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Wishlist creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_wishlists_user_id` on `user_id`

**Foreign Keys**:
- `user_id` → `Users.id` ON DELETE CASCADE

**Notes**:
- Currently, each user has one default wishlist
- Schema supports multiple wishlists per user for future features
- Default name is 'My Wishlist' but can be customized

### 5. WishlistItems

Stores individual items in a user's wishlist.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Internal item identifier |
| `wishlist_id` | `integer` | NOT NULL, FOREIGN KEY | Reference to Wishlists table |
| `tobacco_id` | `integer` | NULLABLE, FOREIGN KEY | Reference to Tobaccos table |
| `custom_name` | `varchar(255)` | NULLABLE | Custom tobacco name (if not in database) |
| `custom_brand` | `varchar(255)` | NULLABLE | Custom brand name (if not in database) |
| `is_purchased` | `boolean` | NOT NULL, DEFAULT false | Purchase status |
| `purchased_at` | `timestamp` | NULLABLE | Purchase timestamp |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Item creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_wishlist_items_wishlist_id` on `wishlist_id`
- `idx_wishlist_items_tobacco_id` on `tobacco_id`
- `idx_wishlist_items_is_purchased` on `is_purchased`
- `idx_wishlist_items_wishlist_tobacco` on `wishlist_id, tobacco_id` (UNIQUE)
- `idx_wishlist_items_wishlist_custom` on `wishlist_id, custom_name` (UNIQUE)

**Foreign Keys**:
- `wishlist_id` → `Wishlists.id` ON DELETE CASCADE
- `tobacco_id` → `Tobaccos.id` ON DELETE SET NULL

**Constraints**:
- Either `tobacco_id` OR `custom_name` must be set (CHECK constraint)
- Cannot have both `tobacco_id` and `custom_name` for the same item

**Notes**:
- Flexibility: Users can add tobaccos not in the database using `custom_name` and `custom_brand`
- `tobacco_id` references known tobaccos from the database
- `custom_name` + `custom_brand` for user-defined tobaccos
- `is_purchased` marks items as bought (they can be filtered out or archived)
- Unique constraints prevent duplicate items in the same wishlist
- When `tobacco_id` is set, `custom_name` and `custom_brand` should be NULL
- When `custom_name` is set, `tobacco_id` should be NULL

## Prisma Schema Definition

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           BigInt    @id @default(autoincrement())
  telegramId   BigInt    @unique @map("telegram_id")
  username     String?   @map("username")
  firstName    String?   @map("first_name")
  lastName     String?   @map("last_name")
  languageCode String?   @map("language_code")
  isBot        Boolean   @default(false) @map("is_bot")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  wishlists    Wishlist[]
  wishlistItems WishlistItem[]
  
  @@map("users")
}

model Brand {
  id            Int      @id @default(autoincrement())
  name          String   @unique
  slug          String   @unique
  htreviewsUrl  String?  @map("htreviews_url")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  tobaccos      Tobacco[]
  
  @@map("brands")
}

model Tobacco {
  id            Int      @id @default(autoincrement())
  name          String
  slug          String
  description   String?  @db.Text
  imageUrl      String?  @map("image_url")
  brandId       Int      @map("brand_id")
  htreviewsUrl  String?  @map("htreviews_url")
  metadata      Json?
  scrapedAt     DateTime? @map("scraped_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  brand         Brand     @relation(fields: [brandId], references: [id], onDelete: Cascade)
  wishlistItems WishlistItem[]
  
  @@unique([brandId, slug])
  @@index([brandId])
  @@index([name])
  @@index([slug])
  @@map("tobaccos")
}

model Wishlist {
  id        Int           @id @default(autoincrement())
  userId    BigInt        @map("user_id")
  name      String        @default("My Wishlist")
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")
  
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     WishlistItem[]
  
  @@index([userId])
  @@map("wishlists")
}

model WishlistItem {
  id           Int       @id @default(autoincrement())
  wishlistId   Int       @map("wishlist_id")
  tobaccoId    Int?      @map("tobacco_id")
  customName   String?   @map("custom_name")
  customBrand  String?   @map("custom_brand")
  isPurchased  Boolean   @default(false) @map("is_purchased")
  purchasedAt  DateTime? @map("purchased_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  wishlist     Wishlist  @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  tobacco      Tobacco?  @relation(fields: [tobaccoId], references: [id], onDelete: SetNull)
  
  @@unique([wishlistId, tobaccoId])
  @@unique([wishlistId, customName])
  @@index([wishlistId])
  @@index([tobaccoId])
  @@index([isPurchased])
  @@map("wishlist_items")
}
```

## Common Queries

### Get User's Wishlist with Tobacco Details

```sql
SELECT 
  wi.id,
  wi.is_purchased,
  wi.purchased_at,
  t.name as tobacco_name,
  t.slug as tobacco_slug,
  t.image_url,
  b.name as brand_name,
  b.slug as brand_slug,
  wi.custom_name,
  wi.custom_brand
FROM wishlist_items wi
JOIN wishlists w ON wi.wishlist_id = w.id
LEFT JOIN tobaccos t ON wi.tobacco_id = t.id
LEFT JOIN brands b ON t.brand_id = b.id
WHERE w.user_id = $1
  AND wi.is_purchased = false
ORDER BY wi.created_at DESC;
```

### Search Tobaccos by Name

```sql
SELECT 
  t.id,
  t.name,
  t.slug,
  t.image_url,
  t.description,
  b.name as brand_name,
  b.slug as brand_slug
FROM tobaccos t
JOIN brands b ON t.brand_id = b.id
WHERE t.name ILIKE '%' || $1 || '%'
   OR b.name ILIKE '%' || $1 || '%'
ORDER BY b.name, t.name
LIMIT 50;
```

### Get Tobaccos by Brand

```sql
SELECT 
  t.id,
  t.name,
  t.slug,
  t.image_url,
  t.description
FROM tobaccos t
JOIN brands b ON t.brand_id = b.id
WHERE b.slug = $1
ORDER BY t.name;
```

### Add Tobacco to Wishlist

```sql
INSERT INTO wishlist_items (wishlist_id, tobacco_id, created_at, updated_at)
VALUES ($1, $2, NOW(), NOW())
ON CONFLICT (wishlist_id, tobacco_id) DO NOTHING;
```

### Add Custom Tobacco to Wishlist

```sql
INSERT INTO wishlist_items (wishlist_id, custom_name, custom_brand, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW())
ON CONFLICT (wishlist_id, custom_name) DO NOTHING;
```

### Mark Item as Purchased

```sql
UPDATE wishlist_items
SET is_purchased = true,
    purchased_at = NOW(),
    updated_at = NOW()
WHERE id = $1;
```

### Remove Item from Wishlist

```sql
DELETE FROM wishlist_items
WHERE id = $1;
```

## Data Integrity Rules

### 1. User-Wishlist Relationship
- Each user must have at least one wishlist (created on first interaction)
- Deleting a user cascades to delete all their wishlists and items

### 2. Wishlist Items
- An item must belong to exactly one wishlist
- Either `tobacco_id` OR `custom_name` must be set (not both)
- Cannot have duplicate items in the same wishlist:
  - Same `tobacco_id` cannot appear twice
  - Same `custom_name` cannot appear twice

### 3. Tobacco-Brand Relationship
- Each tobacco must belong to exactly one brand
- Deleting a brand cascades to delete all its tobaccos
- Tobacco items referencing deleted tobacco have `tobacco_id` set to NULL

### 4. Uniqueness
- `telegram_id` must be unique across users
- Brand `name` and `slug` must be unique
- Tobacco `brand_id` + `slug` combination must be unique

## Migration Strategy

### Initial Migration

1. Create all tables in the correct order (respecting foreign keys)
2. Create indexes for performance
3. Add constraints (UNIQUE, FOREIGN KEY, CHECK)

### Future Migrations

1. Use Prisma migrations for schema changes
2. Always test migrations on staging database first
3. Create backup before running production migrations
4. Document breaking changes

## Performance Considerations

### Indexes
- All foreign keys are indexed
- Search fields (`name`, `slug`) are indexed
- Composite indexes for common query patterns

### Query Optimization
- Use `ILIKE` for case-insensitive search
- Limit result sets with `LIMIT` clause
- Use `JOIN` instead of separate queries
- Consider adding `EXPLAIN ANALYZE` for slow queries

### Caching Strategy (Future)
- Cache tobacco catalog data (rarely changes)
- Cache user wishlist data (changes frequently)
- Use Redis for caching when scaling

## Backup & Recovery

### Backup Strategy
- Daily full backups at 3 AM UTC
- Point-in-time recovery enabled
- Backups retained for 30 days

### Recovery Procedures
1. Restore from most recent backup
2. Apply WAL logs for point-in-time recovery
3. Verify data integrity
4. Test application functionality

## Security Considerations

### Access Control
- Database access restricted to application user only
- No direct database access from public internet
- Use environment variables for credentials

### Data Protection
- Sensitive data (if any) should be encrypted at rest
- Use prepared statements (handled by Prisma)
- Regular security updates for PostgreSQL

### Audit Logging (Future)
- Log all data modifications
- Track who changed what and when
- Implement data retention policies

## Summary

The database schema provides:

✅ **Flexible wishlist management** - Users can add any tobacco, even if not in database
✅ **Structured tobacco catalog** - Organized by brands with detailed metadata
✅ **Data integrity** - Foreign keys, unique constraints, and check constraints
✅ **Performance** - Proper indexing for common queries
✅ **Scalability** - Schema designed to grow with the application
✅ **Maintainability** - Clear structure with Prisma ORM for easy management

The schema supports the core functionality while providing flexibility for future enhancements.
