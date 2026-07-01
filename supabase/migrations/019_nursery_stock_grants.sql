-- Ensure nursery_stock view is readable via API
GRANT SELECT ON nursery_stock TO authenticated;
GRANT SELECT ON nursery_stock TO anon;
