-- Analytics Configuration Settings
INSERT INTO app_settings (key, value)
VALUES 
  ('analytics_kitchen_prep_days', '7'),
  ('analytics_kitchen_peak_days', '7'),
  ('analytics_loyal_patrons_days', '30'),
  ('analytics_hot_zones_days', '30')
ON CONFLICT (key) DO NOTHING;
