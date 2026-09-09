---
title: "Màn hình — Tab chính"
weight: 10
---

# Tab chính (Bottom Bar)

Container: `Main/BottomBar` — bottom tab 4 mục, badge số thông báo chưa đọc trên tab Inbox.

## Home — Trang chủ

- **Tệp:** `Main/Home.tsx` · **FR:** FR-HOME-01
- **Thành phần:** header (tên + điểm + chọn ngôn ngữ), banner carousel, hàng dịch vụ yêu thích, lưới 5 nhóm dịch vụ (+3 mục sắp ra mắt), mục Cập nhật & khuyến mãi.
- **Vào/Đi:** từ đăng nhập hoặc tab; đi tới Service (chọn dịch vụ), Promotion/Detail (chạm banner), AllService, Favourite/Service.
- **Trạng thái:** pull-to-refresh làm mới; token rỗng → replace sang Auth/Login; lỗi API → Alert và giữ giao diện.
- **Hành động:** chạm dịch vụ → mở cấu hình; chạm mục khuyến mãi → chi tiết.

## Booking — Danh sách đơn

- **Tệp:** `Main/Booking.tsx` · **FR:** FR-BOOK-05
- **Thành phần:** header với icon lịch (→ `Booking/Calendar`), hai tab **sắp tới / lịch sử**, danh sách thẻ đơn.
- **Hành động:** chạm đơn sắp tới → `Booking/BookingDetail`; chạm đơn lịch sử → `Booking/DetailHistory`; kéo-cuối tải thêm trang; kéo-tải làm mới (xóa list rồi tải trang 1).

## Inbox — Hộp thông báo

- **Tệp:** `Main/Inbox.tsx` · **FR:** FR-NOTI-01..03
- **Thành phần:** header (đọc tất cả, xóa), hai tab Thông báo / Khuyến mãi, danh sách dòng (chấm vàng = chưa đọc), checkbox chế độ xóa.
- **Hành động:** chạm mục → đánh dấu đã đọc + mở chi tiết; icon trống → xóa mục đã chọn; “Tất cả” → xóa toàn bộ tab; đọc tất cả → POST read-all rồi refresh.

## Account — Tài khoản

- **Tệp:** `Main/Account.tsx` · **FR:** FR-PRO-01
- **Thành phần:** khối hồ sơ (ảnh, tên, điểm), danh sách menu (Hồ sơ, Thanh toán, Yêu thích, My Booking, Về chúng tôi, Giới thiệu…), mục đăng xuất.
- **Hành động:** chạm menu → điều hướng màn tương ứng; đăng xuất → hộp xác nhận → xóa token → về Auth/Login.
