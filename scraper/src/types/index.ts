/**
 * Scraped brand data from htreviews.org
 */
export interface ScrapedBrand {
  /** Brand name */
  name: string;
  /** URL-friendly slug (lowercase, hyphenated) */
  slug: string;
  /** Brand description (may be empty) */
  description: string;
  /** Image URL (may be empty) */
  imageUrl: string;
  /** Full URL to brand page on htreviews.org */
  htreviewsUrl: string;
}

/**
 * Scraped tobacco data from htreviews.org
 */
export interface ScrapedTobacco {
  /** Tobacco name */
  name: string;
  /** URL-friendly slug (lowercase, hyphenated) */
  slug: string;
  /** Tobacco description (may be empty) */
  description: string;
  /** Image URL (may be empty) */
  imageUrl: string;
  /** Full URL to tobacco page on htreviews.org */
  htreviewsUrl: string;
  /** Additional metadata about tobacco */
  metadata: TobaccoMetadata;
}

/**
 * Metadata for a tobacco product
 */
export interface TobaccoMetadata {
  /** Strength rating (e.g., "Mild", "Medium", "Strong") */
  strength: string | null;
  /** Cut type (e.g., "Fine", "Medium", "Coarse") */
  cut: string | null;
  /** Flavor profile description */
  flavorProfile: string | null;
  /** Rating (0-10 or similar scale) */
  rating: number | null;
  /** Number of reviews */
  reviewsCount: number | null;
}

/**
 * Metrics collected during a scrape operation
 */
export interface ScrapeMetrics {
  /** Number of brands successfully added */
  brandsAdded: number;
  /** Number of tobaccos successfully added */
  tobaccosAdded: number;
  /** Number of tobaccos successfully updated */
  tobaccosUpdated: number;
  /** Number of errors encountered */
  errors: number;
  /** Duration of scrape operation in milliseconds */
  duration: number;
  /** List of failed URLs for manual review */
  failedUrls: string[];
}

/**
 * Configuration options for scraper
 */
export interface ScrapeConfig {
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between brand requests in milliseconds */
  delayBrand: number;
  /** Delay between tobacco requests in milliseconds */
  delayTobacco: number;
}

/**
 * Database brand record (from Prisma schema)
 */
export interface DatabaseBrand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database tobacco record (from Prisma schema)
 */
export interface DatabaseTobacco {
  id: number;
  brandId: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of a brand upsert operation
 */
export interface BrandUpsertResult {
  success: boolean;
  brandId?: number;
  isNew: boolean;
  error?: string;
}

/**
 * Result of a tobacco upsert operation
 */
export interface TobaccoUpsertResult {
  success: boolean;
  tobaccoId?: number;
  isNew: boolean;
  error?: string;
}
