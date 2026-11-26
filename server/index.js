require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Kiểm tra xem file .env đã được đọc chưa
if (!process.env.DATABASE_URL) {
  console.error(
    "❌ LỖI: Không tìm thấy DATABASE_URL. Hãy kiểm tra lại file .env trong thư mục server/",
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Bắt buộc có dòng này để chống sập server khi kết nối DB gặp trục trặc
pool.on("error", (err) => {
  console.error("⚠️ Lỗi kết nối ngầm PostgreSQL:", err.message);
});

// Route trang chủ để mở http://localhost:8000 không bị "Cannot GET /"
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Backend Fiabesco đang hoạt động!" });
});

// API Bước 1: Lấy bảng giá bàn và gói trang trí
app.get("/api/dat-ban/bang-gia", async (req, res) => {
  try {
    const tableResult = await pool.query(
      "SELECT DISTINCT fee_type, fee_amount FROM tables WHERE is_active = TRUE",
    );
    const pkgResult = await pool.query(
      "SELECT id, price FROM packages WHERE is_active = TRUE",
    );

    const table = {};
    for (const row of tableResult.rows) {
      table[row.fee_type] = row.fee_amount;
    }

    const pkg = {};
    for (const row of pkgResult.rows) {
      pkg[row.id] = row.price;
    }

    res.json({ table, pkg });
  } catch (err) {
    console.error("❌ Lỗi truy vấn bảng giá:", err.message);
    res
      .status(500)
      .json({ message: "Lỗi kết nối cơ sở dữ liệu", detail: err.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  try {
    await pool.query("SELECT 1");
    console.log("✅ Kết nối Supabase PostgreSQL thành công!");
  } catch (err) {
    console.error("❌ Kết nối Supabase THẤT BẠI:", err.message);
  }
});
