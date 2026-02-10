-- Add Admin and MG Dashboard credentials to app_settings

INSERT INTO app_settings (key, value)
VALUES 
  ('admin_username', 'admin'),
  ('admin_password', 'pizza7870'),
  ('mg_password', 'meny123')
ON CONFLICT (key) DO NOTHING;
