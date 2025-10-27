-- ============================================
-- BUDDASH WISHLIST AND REVIEWS SYSTEM
-- ============================================

-- ============================================
-- WISHLIST SYSTEM
-- ============================================

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own wishlist
CREATE POLICY "Users can view their own wishlist" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert into their own wishlist
CREATE POLICY "Users can insert their own wishlist items" ON wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete from their own wishlist
CREATE POLICY "Users can delete their own wishlist items" ON wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Admins can view all wishlists
CREATE POLICY "Admins can view all wishlists" ON wishlists
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_created_at ON wishlists(created_at DESC);

-- ============================================
-- REVIEWS SYSTEM
-- ============================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all approved reviews
CREATE POLICY "Anyone can view approved reviews" ON reviews
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

-- Policy: Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Admins can view all reviews
CREATE POLICY "Admins can view all reviews" ON reviews
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Policy: Admins can update all reviews
CREATE POLICY "Admins can update all reviews" ON reviews
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Create review_likes table for helpful votes
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all helpful votes
CREATE POLICY "Anyone can view helpful votes" ON review_likes
  FOR SELECT USING (true);

-- Policy: Users can insert their own helpful votes
CREATE POLICY "Users can insert helpful votes" ON review_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own helpful votes
CREATE POLICY "Users can update helpful votes" ON review_likes
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_count ON reviews(helpful_count DESC);

CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);

-- Function to calculate product rating
CREATE OR REPLACE FUNCTION calculate_product_rating(product_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL,
  total_reviews INTEGER,
  rating_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0) as average_rating,
    COUNT(*)::INTEGER as total_reviews,
    jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ) as rating_distribution
  FROM reviews
  WHERE product_id = product_uuid AND status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- Function to mark verified purchase reviews
CREATE OR REPLACE FUNCTION update_verified_purchase_on_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has a completed order for this product
  IF EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = NEW.user_id
      AND oi.product_id = NEW.product_id
      AND o.status = 'delivered'
  ) THEN
    NEW.is_verified_purchase := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-verify purchases
CREATE TRIGGER review_verify_purchase
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_verified_purchase_on_review();

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = (
    SELECT COUNT(*)
    FROM review_likes
    WHERE review_id = NEW.review_id AND is_helpful = true
  )
  WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update helpful count
CREATE TRIGGER review_update_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON review_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Add rating column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update product ratings
CREATE OR REPLACE FUNCTION update_product_ratings()
RETURNS TRIGGER AS $$
BEGIN
  WITH ratings AS (
    SELECT 
      AVG(rating)::DECIMAL(3,2) as avg_rating,
      COUNT(*) as count
    FROM reviews
    WHERE product_id = NEW.product_id AND status = 'approved'
  )
  UPDATE products
  SET 
    average_rating = COALESCE(ratings.avg_rating, 0),
    review_count = COALESCE(ratings.count, 0)
  FROM ratings
  WHERE products.id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product ratings when reviews change
CREATE TRIGGER review_update_product_ratings
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_ratings();

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON review_likes TO authenticated;

-- Add helpful_count column if it doesn't exist (for backward compatibility)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
  END IF;
END $$;

