-- ============================================
-- COMPREHENSIVE THCA DELIVERY PLATFORM SCHEMA
-- ============================================

-- Create ENUM types
CREATE TYPE payment_method_type AS ENUM ('cash', 'crypto');
CREATE TYPE order_status_type AS ENUM ('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_status_type AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE verification_type AS ENUM ('registration', 'delivery');
CREATE TYPE verification_method_type AS ENUM ('jumio', 'manual_scan', 'automatic');
CREATE TYPE product_category_type AS ENUM ('flower', 'edibles', 'vapes', 'concentrates', 'pre-rolls');
CREATE TYPE vehicle_type AS ENUM ('car', 'bike', 'scooter', 'ebike');

-- ============================================
-- DELIVERY ADDRESSES
-- ============================================
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  apartment TEXT,
  city TEXT NOT NULL DEFAULT 'New York',
  state TEXT NOT NULL DEFAULT 'NY',
  zip_code TEXT NOT NULL,
  borough TEXT NOT NULL, -- Brooklyn, Queens, Manhattan, Bronx, Staten Island
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MERCHANTS (Dispensaries/Shops)
-- ============================================
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  borough TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  service_radius DECIMAL(5, 2) DEFAULT 5.0, -- miles
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants are viewable by everyone"
  ON public.merchants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage merchants"
  ON public.merchants FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PRODUCTS (Enhanced with all fields)
-- ============================================
ALTER TABLE public.products
  DROP COLUMN IF EXISTS weight_grams,
  DROP COLUMN IF EXISTS is_concentrate,
  DROP COLUMN IF EXISTS coa_url,
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS weight_grams DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS is_concentrate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS coa_url TEXT, -- Certificate of Analysis
  ADD COLUMN IF NOT EXISTS thc_content DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS cbd_content DECIMAL(5, 2);

-- Update products category to use enum
ALTER TABLE public.products 
  ALTER COLUMN category TYPE TEXT;

-- ============================================
-- INVENTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  stock INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory viewable by everyone"
  ON public.inventory FOR SELECT
  USING (true);

CREATE POLICY "Merchants can manage own inventory"
  ON public.inventory FOR ALL
  USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE email = auth.jwt() ->> 'email'
    )
  );

-- ============================================
-- ENHANCED ORDERS
-- ============================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id),
  ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id),
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Update existing orders to have order numbers
UPDATE public.orders 
SET order_number = 'ORD-' || EXTRACT(EPOCH FROM created_at)::BIGINT || '-' || substring(id::text, 1, 8)
WHERE order_number IS NULL;

-- ============================================
-- ORDER TRACKING
-- ============================================
CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order tracking"
  ON public.order_tracking FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Couriers can update order tracking"
  ON public.order_tracking FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'courier') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- ============================================
-- COURIERS
-- ============================================
CREATE TABLE public.couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  license_number TEXT NOT NULL,
  age_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couriers can view own profile"
  ON public.couriers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Couriers can update own profile"
  ON public.couriers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage couriers"
  ON public.couriers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- DELIVERIES
-- ============================================
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES public.couriers(id),
  
  pickup_lat DECIMAL(10, 8) NOT NULL,
  pickup_lng DECIMAL(11, 8) NOT NULL,
  dropoff_lat DECIMAL(10, 8) NOT NULL,
  dropoff_lng DECIMAL(11, 8) NOT NULL,
  
  estimated_pickup_time TIMESTAMP WITH TIME ZONE,
  actual_pickup_time TIMESTAMP WITH TIME ZONE,
  estimated_dropoff_time TIMESTAMP WITH TIME ZONE,
  actual_dropoff_time TIMESTAMP WITH TIME ZONE,
  
  manifest_url TEXT,
  id_verification_url TEXT,
  delivery_photo_url TEXT,
  signature_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deliveries"
  ON public.deliveries FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Couriers can manage assigned deliveries"
  ON public.deliveries FOR ALL
  USING (courier_id IN (SELECT id FROM public.couriers WHERE user_id = auth.uid()));

-- ============================================
-- AGE VERIFICATIONS
-- ============================================
CREATE TABLE public.age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  verification_method TEXT NOT NULL,
  id_type TEXT,
  id_number TEXT,
  date_of_birth DATE,
  verified BOOLEAN DEFAULT false,
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
  ON public.age_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications"
  ON public.age_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PURCHASE LIMITS TRACKING
-- ============================================
CREATE TABLE public.purchase_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  flower_grams DECIMAL(10, 2) DEFAULT 0,
  concentrate_grams DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.purchase_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own limits"
  ON public.purchase_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can update limits"
  ON public.purchase_limits FOR ALL
  USING (true);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_borough ON public.addresses(borough);
CREATE INDEX IF NOT EXISTS idx_merchants_borough ON public.merchants(borough);
CREATE INDEX IF NOT EXISTS idx_merchants_active ON public.merchants(is_active);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON public.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON public.orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON public.orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_couriers_online ON public.couriers(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_deliveries_courier ON public.deliveries(courier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_limits_user_date ON public.purchase_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================
-- TRIGGERS FOR TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER couriers_updated_at
  BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER purchase_limits_updated_at
  BEFORE UPDATE ON public.purchase_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();