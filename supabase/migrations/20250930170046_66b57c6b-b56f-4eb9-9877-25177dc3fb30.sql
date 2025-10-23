-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('flower', 'edibles', 'vapes', 'concentrates')),
  thca_percentage DECIMAL(4,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  description TEXT,
  strain_info TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone TEXT,
  age_verified BOOLEAN DEFAULT false,
  id_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create cart items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_address TEXT NOT NULL,
  delivery_borough TEXT NOT NULL CHECK (delivery_borough IN ('brooklyn', 'queens', 'manhattan')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bitcoin', 'usdc')),
  delivery_fee DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products are viewable by everyone
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

-- Only admins can insert/update products
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE age_verified = true));

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can manage their own cart items
CREATE POLICY "Users can view own cart"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own order items
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Insert sample products
INSERT INTO public.products (name, category, thca_percentage, price, description, strain_info, in_stock) VALUES
  ('Purple Haze THCA Flower', 'flower', 23.5, 45.00, 'Classic sativa-dominant strain with uplifting effects', 'Sativa-dominant hybrid with sweet berry aroma', true),
  ('OG Kush THCA Flower', 'flower', 25.8, 50.00, 'Legendary indica strain for deep relaxation', 'Indica-dominant with earthy, pine notes', true),
  ('Gelato THCA Flower', 'flower', 22.3, 48.00, 'Balanced hybrid with sweet dessert flavors', 'Hybrid strain with fruity, creamy taste', true),
  ('THCA Gummies - Mixed Berry', 'edibles', 15.0, 35.00, '10mg per gummy, 10 count package', 'Fast-acting, precisely dosed edibles', true),
  ('THCA Chocolate Bar', 'edibles', 18.5, 40.00, '100mg total, 10 pieces', 'Premium dark chocolate infused', true),
  ('Live Resin Vape Cart - Sour Diesel', 'vapes', 82.5, 55.00, '1g cartridge, strain-specific terpenes', 'Energizing sativa effects', true),
  ('THCA Disposable Vape - Blue Dream', 'vapes', 78.3, 45.00, '1g disposable, rechargeable', 'Smooth hybrid for any time', true),
  ('THCA Diamonds', 'concentrates', 95.2, 70.00, 'Pure crystalline THCA, 1g', 'Highest potency available', true),
  ('Live Rosin', 'concentrates', 88.7, 65.00, 'Solventless extraction, full spectrum', 'Premium concentrate', true);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();