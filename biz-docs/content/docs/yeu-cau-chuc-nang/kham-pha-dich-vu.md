---
title: "FR — Khám phá dịch vụ"
weight: 20
---

# FR-HOME / FR-SVC — Trang chủ & khám phá dịch vụ

## FR-HOME-01 · Trang chủ · C

- **Mô tả:** Trang chủ gồm: banner khuyến mãi (carousel), dịch vụ nổi bật theo loại, dịch vụ yêu thích, cập nhật & khuyến mãi.
- **Tiêu chí chấp nhận:**
  - Vào Trang chủ tải đủ: banner, danh mục dịch vụ, badge số thông báo chưa đọc.
  - Kéo-tải (pull-to-refresh) làm mới toàn bộ dữ liệu.
  - Chưa đăng nhập (token rỗng) → tự chuyển tới màn Đăng nhập.

## FR-SVC-01 · Danh mục dịch vụ · C

- **Mô tả:** 5 nhóm dịch vụ: Maid (dọn nhà), Nany (chăm sóc em bé), Elder (chăm sóc người cao tuổi), AC (vệ sinh máy lạnh), Petcare (chăm sóc thú cưng). Mỗi nhóm hiển thị tên song ngữ và ảnh.
- **Tiêu chí chấp nhận:** Chạm dịch vụ → mở trang cấu hình dịch vụ; dịch vụ chưa mở bán có thể hiển thị trạng thái “sắp ra mắt”.

## FR-SVC-02 · Tùy chọn dịch vụ · C

- **Mô tả:** Khách cấu hình số giờ, số phòng/người/thú, dịch vụ thêm (extra services: ủi đồ, dắt chó đi dạo…), chọn helper đặc biệt, nhập ghi chú.
- **Tiêu chí chấp nhận:**
  - Giá cập nhật tức thời khi đổi tùy chọn (theo bảng giá `BL-PRICE-01`).
  - Số giờ ngoài khoảng cho phép → không cho tiếp tục, hiển thị nhãn lỗi.

## FR-SVC-03 · Bảng giá động · C

- **Tiêu chí chấp nhận:**
  - Giá = đơn giá theo giờ × số giờ, cộng giá dịch vụ thêm, trừ ưu đãi gói (xem `BL-PRICE-02`, `BL-SUB-02`).
  - Khách hàng có gói dịch vụ còn giờ → thấy giá ưu đãi so với khách thường.
