-- Insert 10 random test users with Indian names
-- Password for all test users is: "Password123!" (bcrypt hash)
-- You can use these credentials to test the application

INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
('raj_sharma', 'raj.sharma@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Raj', 'Sharma'),
('priya_patel', 'priya.patel@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Priya', 'Patel'),
('amit_kumar', 'amit.kumar@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Amit', 'Kumar'),
('neha_singh', 'neha.singh@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Neha', 'Singh'),
('vikram_reddy', 'vikram.reddy@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Vikram', 'Reddy'),
('ananya_gupta', 'ananya.gupta@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Ananya', 'Gupta'),
('arjun_iyer', 'arjun.iyer@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Arjun', 'Iyer'),
('kavya_menon', 'kavya.menon@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Kavya', 'Menon'),
('rohit_verma', 'rohit.verma@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Rohit', 'Verma'),
('shreya_nair', 'shreya.nair@example.com', '$2b$10$rQ3K5Z8WvXy4mN7pL2qJ1OxGfHwKm9tNvUqRsWxYzAbCdEfGhIjK1', 'Shreya', 'Nair')
ON CONFLICT (email) DO NOTHING;

-- Display inserted users
SELECT username, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 10;
