# 📊 Product Dashboard - NNPTUD Lab

## 👤 Thông tin sinh viên
- **Họ và tên:** Võ Nhật Khánh
- **MSSV:** 2280601481

---

## 📝 Mô tả
Dashboard quản lý sản phẩm sử dụng API public từ [Platzi Fake Store API](https://api.escuelajs.co/api/v1/products).

**Công nghệ sử dụng:**
- HTML5
- CSS3 + Bootstrap 5
- JavaScript (Vanilla JS)

---

## 🎯 8 Chức năng chính

### 1. Load Data
- Tự động tải danh sách sản phẩm từ API khi mở trang
- Hiển thị bảng gồm: ID, Title, Price, Category, Image

### 2. Search (Tìm kiếm)
- Tìm kiếm theo tên sản phẩm (title)
- Filter realtime khi nhập - không reload trang

### 3. Pagination (Phân trang)
- Chọn số item mỗi trang: 5 / 10 / 20
- Nút Previous, Next và số trang

### 4. Sort (Sắp xếp)
- Click header để sort theo ID, Title hoặc Price
- Toggle giữa tăng dần (A-Z) và giảm dần (Z-A)

### 5. Export CSV
- Xuất dữ liệu đang hiển thị ra file CSV
- File gồm: id, title, price, category

### 6. View Detail (Xem chi tiết)
- Click vào sản phẩm để mở modal chi tiết
- Hiển thị đầy đủ thông tin + hình ảnh
- Hover vào row để xem description (tooltip)

### 7. Edit (Chỉnh sửa)
- Nhấn nút Edit trong modal chi tiết
- Sửa title, price và lưu thay đổi
- Gọi API: `PUT /products/{id}`

### 8. Create (Tạo mới)
- Nhấn nút "Create Product"
- Điền form: title, price, description, category, images
- Gọi API: `POST /products`

---

## 🚀 Cách chạy

1. Clone repo:
```bash
git clone https://github.com/NhatKhanh-Lab/NNPTUD-0502.git
```

2. Mở bằng VS Code

3. Sử dụng **Live Server** extension để chạy `index.html`

> ⚠️ **Lưu ý:** Cần chạy qua Live Server để tránh lỗi CORS khi gọi API

---

## 📁 Cấu trúc file

```
├── index.html      # Giao diện HTML + Bootstrap 5
├── main.js         # Logic JavaScript
├── style.css       # Custom CSS
└── README.md       # File này
```

---

## 🔗 API Reference

- **Base URL:** `https://api.escuelajs.co/api/v1`
- **Docs:** [https://fakeapi.platzi.com/en/rest/products/](https://fakeapi.platzi.com/en/rest/products/)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /products | Lấy danh sách sản phẩm |
| POST | /products | Tạo sản phẩm mới |
| PUT | /products/{id} | Cập nhật sản phẩm |
| DELETE | /products/{id} | Xóa sản phẩm |
