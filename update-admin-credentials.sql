-- Update admin portal credentials to admin/admin123
-- The password hash corresponds to 'admin123' hashed with bcrypt

-- Update existing portaladmin user to admin user
UPDATE admin_users 
SET 
  username = 'admin',
  password_hash = '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW',
  email = 'admin@wakeexer.com',
  first_name = 'Admin',
  last_name = 'User',
  failed_login_attempts = 0,
  locked_until = NULL
WHERE username = 'portaladmin';

-- If no portaladmin user exists, create the admin user
INSERT INTO admin_users (username, password_hash, email, first_name, last_name, is_active, password_changed_at, failed_login_attempts)
SELECT 'admin', '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW', 'admin@wakeexer.com', 'Admin', 'User', true, NOW(), 0
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');

-- Verify the update
SELECT username, email, first_name, last_name, is_active FROM admin_users WHERE username = 'admin';
