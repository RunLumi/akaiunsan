---
title: "Chỉ số tra cứu"
weight: 950
---

# Chỉ số tra cứu mã định danh

Một trang duy nhất để tra mọi mã yêu cầu/quy tắc đã dùng trong tài liệu. Chọn mã để nhảy tới trang định nghĩa.

## Tính năng (F)

| Mã | Tên | Trang |
|---|---|---|
| `F-ACC-01..06` | Đăng ký, đăng nhập, quên mật khẩu, đổi mật khẩu, phiên, đa ngôn ngữ | [Tính năng — Tài khoản](/docs/tinh-nang/) |
| `F-HOME-01` | Trang chủ | [Tính năng — Khám phá](/docs/tinh-nang/) |
| `F-SVC-01..03` | Danh mục, tùy chọn, bảng giá động | [Tính năng — Khám phá](/docs/tinh-nang/) |
| `F-BOOK-01..07` | Chọn ngày giờ, helper, địa chỉ, tạo đơn, theo dõi, hủy, yêu cầu đặc biệt | [Tính năng — Đặt lịch](/docs/tinh-nang/) |
| `F-PAY-01..05` | Thẻ, thanh toán thẻ/tiền mặt, khuyến mãi, điểm | [Tính năng — Thanh toán](/docs/tinh-nang/) |
| `F-NOTI-01..03` | Inbox, badge, deep link | [Tính năng — Thông báo](/docs/tinh-nang/) |
| `F-PRO-01..02` | Hồ sơ, sổ địa chỉ | [Tính năng — Hồ sơ](/docs/tinh-nang/) |
| `F-FAV-01` / `F-HIST-01` / `F-SUB-01` / `F-REF-01` | Yêu thích / Lịch sử & đánh giá / Gói dịch vụ / Giới thiệu | [Tính năng — Hồ sơ](/docs/tinh-nang/) |
| `F-ADM-01..04` | Quản trị: dịch vụ & giá, helper, đơn, khuyến mãi | [Tính năng — Quản trị](/docs/tinh-nang/) |

## Yêu cầu chức năng (FR)

| Nhóm | Các mã | Trang chi tiết |
|---|---|---|
| Tài khoản & xác thực | `FR-ACC-01` → `FR-ACC-06` | [FR-ACC](/docs/yeu-cau-chuc-nang/tai-khoan-xac-thuc/) |
| Trang chủ | `FR-HOME-01` | [FR-HOME/SVC](/docs/yeu-cau-chuc-nang/kham-pha-dich-vu/) |
| Dịch vụ | `FR-SVC-01` → `FR-SVC-03` | [FR-HOME/SVC](/docs/yeu-cau-chuc-nang/kham-pha-dich-vu/) |
| Đặt lịch & đơn | `FR-BOOK-01` → `FR-BOOK-07` | [FR-BOOK](/docs/yeu-cau-chuc-nang/dat-lich-don-hang/) |
| Thanh toán | `FR-PAY-01` → `FR-PAY-05` | [FR-PAY](/docs/yeu-cau-chuc-nang/thanh-toan/) |
| Thông báo | `FR-NOTI-01` → `FR-NOTI-03` | [FR-NOTI](/docs/yeu-cau-chuc-nang/thong-bao/) |
| Hồ sơ & tiện ích | `FR-PRO-01/02`, `FR-FAV-01`, `FR-HIST-01`, `FR-SUB-01`, `FR-REF-01` | [FR-PRO & tiện ích](/docs/yeu-cau-chuc-nang/ho-so-tien-ich/) |

## Yêu cầu phi chức năng (NFR)

`NFR-01` Hiệu năng · `NFR-02` Bảo mật · `NFR-03` Sẵn sàng · `NFR-04` Đa ngôn ngữ · `NFR-05` Giao diện nhất quán · `NFR-06` Tương thích · `NFR-07` Khả năng kiểm thử · `NFR-08` Quan sát · `NFR-09` Khả năng truy cập · `NFR-10` Dữ liệu cá nhân

→ [Chi tiết NFR](/docs/yeu-cau-phi-chuc-nang/)

## Quy tắc nghiệp vụ (BL)

| Nhóm | Các mã | Trang |
|---|---|---|
| Đơn hàng | `BL-ORD-01` (trạng thái) · `BL-ORD-02` (luật chuyển) · `BL-ORD-03` (đánh giá) · `BL-ORD-04` (yêu cầu đặc biệt) | [Trạng thái đơn hàng](/docs/nghiep-vu/trang-thai-don-hang/) |
| Giá | `BL-PRICE-01` (thành giá) · `BL-PRICE-02` (ưu đãi gói) | [Giá & điểm](/docs/nghiep-vu/gia-va-diem/) |
| Điểm | `BL-POINT-01` (quy đổi) · `BL-POINT-02` (tích điểm) | [Giá & điểm](/docs/nghiep-vu/gia-va-diem/) |
| Khuyến mãi | `BL-PROMO-01` (loại) · `BL-PROMO-02` (điều kiện) · `BL-PROMO-03` (thứ tự tính) · `BL-PROMO-04` (hiển thị) | [Khuyến mãi](/docs/nghiep-vu/khuyen-mai/) |
| Gói dịch vụ | `BL-SUB-01` (loại gói) · `BL-SUB-02` (ưu đãi giá) · `BL-SUB-03` (gia hạn) · `BL-SUB-04` (hủy) · `BL-SUB-05` (kết hợp) | [Gói dịch vụ](/docs/nghiep-vu/goi-dich-vu/) |
| Helper | `BL-HELP-01` (gợi ý) · `BL-HELP-02` (helper đặc biệt) · `BL-HELP-03` (ngôn ngữ) · `BL-HELP-04` (yêu thích) | [Ghép helper](/docs/nghiep-vu/ghep-helper/) |