---
title: "API tổng quan"
weight: 650
---

# API tổng quan

Backend Express 5 tổ chức API thành **5 nhóm route** theo tầng truy cập. Số liệu dưới đây lấy trực tiếp từ `backend/routes/` (thay đổi khi backend phát triển — đây là bức tranh định hướng, không phải hợp đồng endpoint chi tiết).

## 1. Các nhóm route

| Nhóm | Tệp | Số endpoint | Xác thực | Dùng bởi |
|---|---|---|---|---|
| **Public** | `public.route.ts` | 25 | Không (công khai) | Đăng ký/đăng nhập, quên mật khẩu, banner, danh mục dịch vụ công khai |
| **Client** | `client.route.ts` | 43 | JWT khách hàng | Đơn hàng, địa chỉ, thẻ, thông báo, hồ sơ, gói, yêu thích |
| **Back-office** | `backoffice.route.ts` | 127 | JWT quản trị + phân quyền | Toàn bộ vận hành: dịch vụ, giá, helper, đơn, khuyến mãi |
| **Agency** | `agency.route.ts` | 8 | JWT đối tác | Tích hợp đối tác |
| **Bot** | `bot.route.ts` | 3 | Khóa riêng | Tích hợp chatbot |

## 2. Quy ước bảo mật chung

1. **`/client/*`** yêu cầu `Authorization: Bearer <JWT>` (`clientValidator`) — JWT hết hạn → 401 → ứng dụng tự đăng xuất (FR-ACC-05).
2. **`/back-office/*`** yêu cầu JWT quản trị, middleware `recordHistory` và kiểm tra quyền `checkPermission` theo từng phân hệ.

## 3. Nhóm endpoint client hay dùng nhất

| Đường dẫn | Phương thức | Mục đích | FR liên quan |
|---|---|---|---|
| `/auth/signin`, `/auth/signup`, `/auth/forget-password`, `/auth/reset-password` | POST | Xác thực | FR-ACC-01..03 |
| `/client/user`, `/client/user/language` | GET / PUT | Hồ sơ, ngôn ngữ | FR-PRO-01, FR-ACC-06 |
| `/client/addresses` | GET / POST / PUT / DELETE | Sổ địa chỉ | FR-PRO-02 |
| `/client/jobs` | GET | Danh sách đơn (lọc `orderStatus`, `page`) | FR-BOOK-05 |
| `/booking/detail`, `/booking/detail/edit` | GET / PUT | Chi tiết / sửa đơn | FR-BOOK-04/06 |
| `/orders/*` | POST | Tạo đơn từng loại dịch vụ, hủy, đánh giá | FR-BOOK-04/06 |
| `/client/credit-cards` | GET / POST / PUT / DELETE | Thẻ thanh toán | FR-PAY-01/02 |
| `/charges`, `/charges-card`, `/charges-plan` | POST | Thực hiện thanh toán | FR-PAY-02/03 |
| `/promotion/*` | GET / POST | Khuyến mãi (áp mã, chi tiết) | FR-PAY-04 |
| `/client/subscriptions` | GET / PUT | Gói dịch vụ | FR-SUB-01..04 |
| `/client/notifications` | GET / POST / DELETE | Thông báo (danh sách, đọc tất cả, xóa) | FR-NOTI-01 |
| `/favourite/services`, `/favourite/service-providers` | GET / POST | Yêu thích | FR-FAV-01 |
| `/services-management*`, `/config-price`, `/config-point` | GET | Dịch vụ, bảng giá, điểm | FR-SVC-02/03 |
