-- Create participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  color_class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day INTEGER NOT NULL,
  time TEXT NOT NULL,
  period TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE activities
ADD COLUMN location_url TEXT;

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payer_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  image_url TEXT NOT NULL,
  aspect_ratio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Basic public access for demo
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON participants FOR ALL USING (true);
CREATE POLICY "Public Access" ON activities FOR ALL USING (true);
CREATE POLICY "Public Access" ON expenses FOR ALL USING (true);
CREATE POLICY "Public Access" ON memories FOR ALL USING (true);

-- Insert some initial participants
INSERT INTO participants (name, initials, color_class) VALUES
('Hương', 'HU', 'bg-primary-fixed text-primary'),
('Ly', 'LY', 'bg-secondary-fixed text-on-secondary-fixed'),
('Thảo', 'TH', 'bg-tertiary-fixed text-on-tertiary-fixed'),
('Thư', 'TH', 'bg-primary-fixed text-primary'),
('Duy', 'DU', 'bg-secondary-fixed text-on-secondary-fixed'),
('Vĩnh', 'VI', 'bg-tertiary-fixed text-on-tertiary-fixed'),
('Vũ', 'VU', 'bg-primary-fixed text-primary'),
('Hòa', 'HO', 'bg-secondary-fixed text-on-secondary-fixed'),
('Nam', 'NA', 'bg-tertiary-fixed text-on-tertiary-fixed'),
('Thịnh', 'TH', 'bg-primary-fixed text-primary');


CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memories');
CREATE POLICY "Public View" ON storage.objects FOR SELECT USING (bucket_id = 'memories');

-- Ensure the activities table has the correct column
-- (Run this if you still see schema cache errors)
ALTER TABLE activities RENAME COLUMN "imageUrl" TO image_url;



DROP POLICY IF EXISTS "Public Access" ON memories;

CREATE POLICY "Public Access"
ON memories
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON participants;
CREATE POLICY "Public Access"
ON participants
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON activities;
CREATE POLICY "Public Access"
ON activities
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON expenses;
CREATE POLICY "Public Access"
ON expenses
FOR ALL
TO anon
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

CREATE POLICY "Public Upload"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'memories');



-- Day 1: SÀI GÒN - VŨNG TÀU (Chủ Nhật 26/04)
INSERT INTO activities (day, time, period, title, location, description, image_url) VALUES
(1, '03:00', 'Sáng', 'Ngắm bình minh biển', 'Mũi Nghinh Phong', 'Xuất phát sớm từ HCM để kịp tới Vũng Tàu. Chuẩn bị sẵn cà phê/nước đóng chai.', NULL),
(1, '07:30', 'Sáng', 'Ăn sáng đặc sản', 'Khu vực trung tâm', 'Chi phí: 60k - 80k/ng. Hủ tiếu mực (Ông Già Cali hoặc Ngài).', NULL),
(1, '09:30', 'Sáng', 'Check-in tháp & tâm linh', 'Tháp Tam Thắng / Đình Thắng Tam', 'Miễn phí tham quan. Trà cúc / Nước mát.', NULL),
(1, '11:00', 'Trưa', 'Ăn trưa đặc sản', 'Bãi Trước / Hạ Long', 'Chi phí: 70k - 100k/ng. Op 1: Bánh khọt Cô Ba. Op 2: Gành Hào 2.', NULL),
(1, '13:30', 'Chiều', 'Thủ tục nhận phòng', 'CSJ Tower (5tr2/đêm)', 'Gom sẵn CCCD của 10 người. Nghỉ ngơi tại căn hộ.', NULL),
(1, '15:30', 'Chiều', 'Cung đường biển phía Tây', 'Bãi Dâu / Hẻm 107-109 Trần Phú', 'Check-in hẻm sống ảo mới 2026. Nước ép / Sinh tố.', NULL),
(1, '17:30', 'Chiều', 'Ngắm hoàng hôn biển', 'Đường Trần Phú ven biển', 'Không gian thoáng, sát mặt biển. Cà phê Oasis.', NULL),
(1, '19:00', 'Tối', 'PARTY BBQ TẠI CSJ', 'CSJ Tower', 'Mua mồi quán, đi chợ Cô Giang, ốc Thiên Nhiên.', NULL),
(1, '22:30', 'Tối', 'Dạo phố đêm', 'Công viên Bãi Sau', 'Đi bộ. Sữa đậu nành / Trứng lòng đào.', NULL);

-- Day 2: VŨNG TÀU - SÀI GÒN (Thứ Hai 27/04)
INSERT INTO activities (day, time, period, title, location, description, image_url) VALUES
(2, '07:30', 'Sáng', 'Ăn sáng nạp năng lượng', 'Khu vực Bãi Sau', 'Chi phí: 50k/ng. Bún hải sản, Bánh mì chảo...', NULL),
(2, '08:30', 'Sáng', 'Chinh phục đỉnh cao', 'Ngọn Hải Đăng', 'Đường dốc, view toàn cảnh 2026. Sữa chua muối, trứng lòng đào.', NULL),
(2, '10:30', 'Sáng', 'Check-in tự do', 'Hẻm 107, 444 Trần Phú', 'Miễn phí. Cà phê Sơn Đăng.', NULL),
(2, '12:00', 'Trưa', 'Trả phòng', 'CSJ Tower', 'Kiểm tra hành lý kỹ. Thu dọn tại sảnh.', NULL),
(2, '13:00', 'Trưa', 'Ăn trưa tổng kết', '44 Trương Định , 18 Hùng Vương', 'Lẩu cá đuối (Hoàng Minh, Cô Hồng).', NULL),
(2, '14:30', 'Chiều', 'Mua quà & Khởi hành', '17B Nguyễn Trường Tộ', 'Bánh mới ra lò. Bông lan trứng muối Golden, Gốc Cột Điện.', NULL),
(2, '18:00', 'Chiều', 'Về tới Sài Gòn', 'HCM', 'Kết thúc hành trình. Chia tay nhóm tại HCM.', NULL);


-- Junction table for split expenses
CREATE TABLE expense_participants (
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, participant_id)
);

ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON expense_participants FOR ALL USING (true);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Ẩm thực';

-- Settings table for app-wide configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public access for demo
CREATE POLICY "Public Access" ON settings FOR ALL USING (true);

-- Initialize default settings
INSERT INTO settings (key, value) VALUES 
  ('treasurer_id', '""'),
  ('settlement_payments', '{}')
ON CONFLICT (key) DO NOTHING;

-- Fund contributions table
CREATE TABLE IF NOT EXISTS fund_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fund_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON fund_contributions FOR ALL USING (true);

