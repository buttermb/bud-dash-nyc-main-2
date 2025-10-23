-- Update all flower products with proper weight-based pricing and descriptions

-- Gelato #41 Premium
UPDATE products 
SET 
  description = 'Top-shelf Gelato phenotype #41. Dense purple-tinged buds covered in frosty trichomes. Sweet creamy flavors with hints of berry and citrus. Balanced hybrid perfect for any time use. Lab-tested at 30.2% THCa.',
  prices = '{"3.5g": 65, "7g": 117, "14g": 214.5, "28g": 390}'::jsonb,
  strain_type = 'hybrid',
  effects = ARRAY['relaxed', 'happy', 'uplifted', 'creative']
WHERE name = 'Gelato #41 Premium' AND category = 'flower';

-- OG Kush Classic
UPDATE products 
SET 
  description = 'Legendary OG Kush strain with authentic genetics. Pine and earth flavors with diesel undertones. Powerful indica-dominant effects ideal for evening relaxation and pain relief. Dense, resinous buds with 24.3% THCa.',
  prices = '{"3.5g": 55, "7g": 99, "14g": 181.5, "28g": 330}'::jsonb,
  strain_type = 'indica',
  effects = ARRAY['relaxed', 'sleepy', 'euphoric', 'happy']
WHERE name = 'OG Kush Classic' AND category = 'flower';

-- Wedding Cake Premium
UPDATE products 
SET 
  description = 'Elite Wedding Cake phenotype with stunning purple and white coloration. Sweet vanilla and earthy flavors with a smooth, creamy exhale. Potent indica-dominant effects for deep relaxation. Premium quality at 27.8% THCa.',
  prices = '{"3.5g": 70, "7g": 126, "14g": 231, "28g": 420}'::jsonb,
  strain_type = 'indica',
  effects = ARRAY['relaxed', 'happy', 'euphoric', 'sleepy']
WHERE name = 'Wedding Cake Premium' AND category = 'flower';

-- Gelato THCA Flower
UPDATE products 
SET 
  description = 'Classic Gelato strain with balanced hybrid effects. Sweet dessert-like flavors reminiscent of ice cream and berries. Smooth smoke and beautiful trichome coverage. Perfect for daytime or evening use at 22.3% THCa.',
  prices = '{"3.5g": 48, "7g": 86.4, "14g": 158.4, "28g": 288}'::jsonb,
  strain_type = 'hybrid',
  effects = ARRAY['happy', 'relaxed', 'uplifted', 'creative']
WHERE name = 'Gelato THCA Flower' AND category = 'flower';

-- OG Kush THCA Flower
UPDATE products 
SET 
  description = 'Legendary indica strain perfect for deep relaxation and stress relief. Classic OG flavors of pine, earth, and lemon. Known for powerful body effects and mental calm. Premium indoor-grown at 25.8% THCa.',
  prices = '{"3.5g": 50, "7g": 90, "14g": 165, "28g": 300}'::jsonb,
  strain_type = 'indica',
  effects = ARRAY['relaxed', 'sleepy', 'happy', 'euphoric']
WHERE name = 'OG Kush THCA Flower' AND category = 'flower';

-- Purple Haze THCA Flower
UPDATE products 
SET 
  description = 'Classic sativa-dominant strain with uplifting cerebral effects. Sweet berry and earthy flavors with a hint of spice. Energizing and creative, perfect for daytime activities. Vibrant purple hues at 23.5% THCa.',
  prices = '{"3.5g": 45, "7g": 81, "14g": 148.5, "28g": 270}'::jsonb,
  strain_type = 'sativa',
  effects = ARRAY['energizing', 'creative', 'uplifted', 'focused']
WHERE name = 'Purple Haze THCA Flower' AND category = 'flower';

-- Jeeters Gelato Infused
UPDATE products 
SET 
  description = 'Premium Jeeters infused pre-roll enhanced with cannabis oil for maximum potency. Sweet Gelato strain with dessert-like flavors. Balanced hybrid effects perfect for sharing or solo sessions. 32.4% THCa with added concentrate.',
  prices = '{"3.5g": 55, "7g": 99, "14g": 181.5, "28g": 330}'::jsonb,
  strain_type = 'hybrid',
  effects = ARRAY['happy', 'relaxed', 'euphoric', 'uplifted']
WHERE name = 'Jeeters Gelato Infused' AND category = 'flower';

-- Jeeters Runtz XL
UPDATE products 
SET 
  description = 'Jeeters XL pre-roll featuring exotic Runtz strain. Candy-like flavors with tropical fruit notes and a sweet finish. Balanced hybrid effects suitable for any time of day. Premium quality at 29.7% THCa.',
  prices = '{"3.5g": 60, "7g": 108, "14g": 198, "28g": 360}'::jsonb,
  strain_type = 'hybrid',
  effects = ARRAY['happy', 'uplifted', 'relaxed', 'creative']
WHERE name = 'Jeeters Runtz XL' AND category = 'flower';

-- Sluggers Blueberry Cookies
UPDATE products 
SET 
  description = 'Premium Sluggers pre-roll featuring Blueberry Cookies strain. Indica-dominant hybrid with sweet blueberry and cookie dough flavors. Relaxing effects perfect for evening unwinding. High-quality flower at 28.5% THCa.',
  prices = '{"3.5g": 45, "7g": 81, "14g": 148.5, "28g": 270}'::jsonb,
  strain_type = 'indica',
  effects = ARRAY['relaxed', 'happy', 'sleepy', 'euphoric']
WHERE name = 'Sluggers Blueberry Cookies' AND category = 'flower';

-- Sluggers Sunset Sherbet
UPDATE products 
SET 
  description = 'Sluggers premium flower featuring Sunset Sherbet strain. Indica-dominant with fruity citrus notes and creamy undertones. Powerful relaxation with award-winning genetics. Top-shelf quality at 26.8% THCa.',
  prices = '{"3.5g": 50, "7g": 90, "14g": 165, "28g": 300}'::jsonb,
  strain_type = 'indica',
  effects = ARRAY['relaxed', 'happy', 'euphoric', 'uplifted']
WHERE name = 'Sluggers Sunset Sherbet' AND category = 'flower';

-- Update concentrates with proper pricing
UPDATE products 
SET prices = '{"1g": 55}'::jsonb
WHERE name = 'Golden Shatter - Gelato' AND category = 'concentrates';

UPDATE products 
SET prices = '{"1g": 65}'::jsonb
WHERE name = 'Live Resin Sugar - Blue Dream' AND category = 'concentrates';

UPDATE products 
SET 
  prices = '{"1g": 65}'::jsonb,
  description = 'Premium solventless live rosin extraction. Full-spectrum terpene profile with maximum flavor retention. Golden colored, sticky consistency perfect for dabbing. No solvents used, just heat and pressure. 88.7% THCa purity.'
WHERE name = 'Live Rosin' AND category = 'concentrates';

UPDATE products 
SET 
  prices = '{"1g": 70}'::jsonb,
  description = 'Pure crystalline THCA diamonds with 95.2% potency. Nearly pure THCa in crystalline form with incredible clarity. For experienced users seeking maximum potency. Perfect for dabbing at low temperatures.'
WHERE name = 'THCA Diamonds' AND category = 'concentrates';

-- Update vapes with proper pricing
UPDATE products 
SET 
  prices = '{"1g": 65}'::jsonb,
  description = 'Premium live resin vape cartridge featuring Blue Dream strain. Full-spectrum cannabis oil preserving natural terpenes. Smooth vapor with sweet berry flavors. 510-thread compatible, lab-tested at 85.6% THCa.'
WHERE name = 'Live Resin Vape - Blue Dream' AND category = 'vapes';

UPDATE products 
SET 
  prices = '{"1g": 55}'::jsonb,
  description = 'Live resin vape cartridge with classic Sour Diesel strain. Strain-specific terpenes for authentic diesel and citrus flavors. Energizing sativa effects in convenient vape form. 82.5% THCa with natural cannabis terpenes.'
WHERE name = 'Live Resin Vape Cart - Sour Diesel' AND category = 'vapes';