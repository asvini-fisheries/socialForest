-- Ensure users can be looked up by email (case-insensitive) for login
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_lower
  ON users (LOWER(email))
  WHERE email IS NOT NULL;

-- Sync admin email for login
UPDATE users
SET email = 'miswebapps@gmail.com', updated_at = NOW()
WHERE mobile = '9999999999' AND role = 'admin';
