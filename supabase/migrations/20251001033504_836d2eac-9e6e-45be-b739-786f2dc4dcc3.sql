-- Update product image URLs to point to public folder
UPDATE products 
SET image_url = CASE 
  WHEN name LIKE '%Sluggers%' THEN '/products/sluggers-preroll.jpg'
  WHEN name LIKE '%Jeeters%' THEN '/products/jeeters-preroll.jpg'
  WHEN name LIKE '%Gelato%' THEN '/products/gelato-flower.jpg'
  WHEN name LIKE '%OG Kush%' THEN '/products/og-kush.jpg'
  WHEN name LIKE '%Wedding Cake%' THEN '/products/wedding-cake.jpg'
  WHEN name LIKE '%Vape%' THEN '/products/premium-vape.jpg'
  WHEN name LIKE '%Gummies%' THEN '/products/gummies.jpg'
  WHEN name LIKE '%Shatter%' OR name LIKE '%Live Resin Sugar%' THEN '/products/shatter.jpg'
END
WHERE image_url LIKE '/src/assets/products/%';