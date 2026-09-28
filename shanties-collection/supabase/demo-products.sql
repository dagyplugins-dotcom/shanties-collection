-- OPTIONAL: sample products (no photos) so you can see the storefront working.
-- Delete them later from the admin dashboard. Run AFTER schema.sql.
insert into public.products (name, slug, description, price, previous_price, stock_quantity, category_id, subcategory_id, keywords, is_featured, is_popular, featured_order, popular_order)
select v.name, public.sc_slugify(v.name), v.descr, v.price::numeric, v.prev::numeric, v.stock::int, c.id, s.id, v.kw, v.feat::boolean, v.pop::boolean, v.ord::int, v.ord::int
from (values
  ('Women''s Leather Handbag', 'Roomy everyday handbag with a zip closure and inner pockets.', 3500, 4500, 12, 'fashion', 'bags', 'handbag purse tote', true, true, 1),
  ('Classic Analog Watch', 'Stainless steel case with a comfortable adjustable strap.', 2800, null, 20, 'fashion', 'watches', 'wristwatch', true, false, 2),
  ('Men''s Casual Sneakers', 'Lightweight sneakers with a cushioned sole for all-day wear.', 3200, 3800, 3, 'fashion', 'shoes', 'shoes trainers sneakers', false, true, 3),
  ('Vitamin C Face Serum', 'Brightening daily serum for a fresh, even-looking complexion.', 1450, null, 30, 'beauty-personal-care', 'skincare', 'serum face skin glow', true, true, 4),
  ('Shea Butter Body Lotion', 'Rich, non-greasy moisture for soft skin.', 850, 1000, 40, 'beauty-personal-care', 'bath-body', 'lotion moisturiser', false, true, 5),
  ('Smart Fitness Watch', 'Tracks steps, heart rate and sleep with a bright colour display.', 4500, 5500, 15, 'electronics', 'smart-watches', 'smartwatch fitness tracker', true, false, 6),
  ('Non-Stick Cookware Set', '5-piece non-stick set with heat-resistant handles.', 6200, 7500, 8, 'home-kitchen', 'cookware', 'sufuria pots pans', true, true, 7),
  ('Cotton Bedding Set', 'Soft cotton duvet cover and pillowcases.', 3900, null, 0, 'home-kitchen', 'bedding', 'duvet bedsheets', false, false, 8),
  ('Digital Air Fryer 5L', 'Cook crispy meals with little oil. Digital controls and 5L basket.', 9800, 11500, 6, 'appliances', 'air-fryers', 'airfryer', true, true, 9),
  ('Stainless Steel Electric Kettle', 'Fast-boil 1.7L kettle with auto shut-off.', 1900, null, 25, 'appliances', 'kettles', 'kettle boil', false, true, 10),
  ('Baby Feeding Bottle Set', 'BPA-free bottles with slow-flow teats, set of 3.', 1200, 1500, 18, 'baby-kids', 'feeding', 'bottle feeding', true, false, 11),
  ('Wooden Learning Blocks', 'Colourful wooden blocks that help little ones learn shapes and counting.', 950, null, 22, 'baby-kids', 'toys', 'blocks toy learning', false, true, 12)
) as v(name, descr, price, prev, stock, cs, ss, kw, feat, pop, ord)
join public.categories c on c.slug = v.cs
join public.subcategories s on s.category_id = c.id and s.slug = v.ss
on conflict (slug) do nothing;
