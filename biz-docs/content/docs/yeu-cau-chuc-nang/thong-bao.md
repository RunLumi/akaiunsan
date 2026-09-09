---
title: "FR — Thông báo"
weight: 50
---

# FR-NOTI — Thông báo

## FR-NOTI-01 · Hộp thông báo · C

- **Luồng chính:** Tab Inbox → hai tab con: **Thông báo** (đơn hàng, loại 0/3) và **Khuyến mãi** (loại 1/2). Mỗi dòng hiển thị tiêu đề, thời gian (múi giờ Việt Nam), chấm vàng nếu chưa đọc.
- **Tiêu chí chấp nhận:**
  - Chạm thông báo đơn hàng → đánh dấu đã đọc, badge giảm 1, mở chi tiết đơn.
  - Chạm thông báo khuyến mãi → mở chi tiết khuyến mãi/news tương ứng.
  - Chạm “đọc tất cả” → mọi mục tab hiện tại thành đã đọc, badge cập nhật.
  - Chế độ xóa: chọn từng mục hoặc “tất cả” → xác nhận → các mục bị xóa, danh sách tải lại.
  - Kéo xuống cuối → tải trang tiếp theo (phân trang); kéo xuống đầu → làm mới về trang 1.

## FR-NOTI-02 · Badge chưa đọc · C

- **Tiêu chí chấp nhận:** Badge trên tab hiển thị đúng `totalUnRead` từ server; sau đọc/xóa, badge giảm tương ứng; khi 0 thì ẩn badge.

## FR-NOTI-03 · Thông báo đẩy & deep link · C

- **Tiêu chí chấp nhận:**
  - Nhận đẩy khi app đang mở và khi app bị đóng (notification đã được ghi nhận hệ thống).
  - Mở app từ thông báo → điều hướng đúng màn hình theo loại: đơn hàng → chi tiết đơn; khuyến mãi/news → chi tiết khuyến mãi.
  - Đăng ký token thiết bị diễn ra sau đăng nhập; token đổi không mất đăng ký.
