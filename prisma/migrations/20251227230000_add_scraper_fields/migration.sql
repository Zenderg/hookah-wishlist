-- Add htreviews_url column to brands table
ALTER TABLE "brands" ADD COLUMN "htreviewsUrl" TEXT;

-- Add htreviews_url column to tobaccos table
ALTER TABLE "tobaccos" ADD COLUMN "htreviewsUrl" TEXT;

-- Add metadata column to tobaccos table
ALTER TABLE "tobaccos" ADD COLUMN "metadata" JSONB;

-- Add scraped_at column to tobaccos table
ALTER TABLE "tobaccos" ADD COLUMN "scrapedAt" TIMESTAMP(3);

-- Add index on tobaccos.name
CREATE INDEX IF NOT EXISTS "tobaccos_name_idx" ON "tobaccos"("name");

-- Add map annotations for consistency
COMMENT ON COLUMN "brands"."htreviewsUrl" IS 'URL to brand page on htreviews.org';
COMMENT ON COLUMN "tobaccos"."htreviewsUrl" IS 'URL to tobacco page on htreviews.org';
COMMENT ON COLUMN "tobaccos"."metadata" IS 'Additional metadata about tobacco (strength, cut, flavorProfile, rating, reviewsCount)';
COMMENT ON COLUMN "tobaccos"."scrapedAt" IS 'Timestamp when tobacco was last scraped';
