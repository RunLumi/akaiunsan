---
title: "Hướng dẫn kiểm thử"
weight: 800
---

# Hướng dẫn kiểm thử dành cho Tester

## 1. Nguyên tắc viết test case

- **Traceability 2 chiều:** mỗi `TC-` phải trỏ về ít nhất một `FR-`/`BL-`; ngược lại mọi FR bắt buộc phải có tối thiểu 1 TC luồng chính.
- **Một test case — một mục đích:** tách luồng thành công và từng luồng lỗi thành các TC riêng.
- Viết **tiêu chí chấp nhận** của FR chính là kỳ vọng (Expected Result) của TC.

Cấu trúc TC khuyến nghị:

| Trường | Nội dung |
|---|---|
| TC-ID | `TC-<MODULE>-<số>` (ví dụ `TC-BOOK-004`) |
| Liên kết | `FR-BOOK-04`, `BL-PROMO-03` |
| Tiền điều kiện | Đã đăng nhập; có thẻ mặc định; có gói dịch vụ còn giờ |
| Dữ liệu | Dịch vụ: Dọn nhà 3 giờ; mã KM `TEST50` |
| Các bước | 1…2…3… |
| Kết quả mong đợi | Xem lại hiển thị 400.000₫ (BL-PROMO-03 ví dụ) |
| Ưu tiên | C / H / M |

## 2. Môi trường & công cụ

| Hạng mục | Giá trị |
|---|---|
| Môi trường | Staging (UAT) — dữ liệu giống production |
| Thiết bị tối thiểu | 1 iOS + 1 Android, màn hình lớn và nhỏ (≥ 2 kích thước mỗi nền tảng) |
| Ngôn ngữ | Lặp lại các TC quan trọng ở TIẾNG VIỆT và TIẾNG ANH |
| Tài khoản | 1 tài khoản khách thường, 1 khách có gói dịch vụ, 1 tài khoản mới đăng ký |
| Thẻ kiểm thử | Thẻ sandbox của cổng thanh toán (không dùng thẻ thật) |

## 3. Checklist theo màn hình

Toàn bộ 36 màn hình được liệt kê kèm route + FR liên quan ở [Danh mục màn hình](/docs/man-hinh/) — dùng làm checklist đảm bảo **mỗi màn hình đều được mở ít nhất một lần** trong chu kỳ kiểm thử (kể cả màn rỗng/lỗi).

## 4. Ma trận kiểm thử theo module

| Module | Luồng chính | Luồng lỗi bắt buộc |
|---|---|---|
| Tài khoản (FR-ACC) | Đăng ký, đăng nhập, Google | Sai mật khẩu, email trùng, token hết hạn |
| Trang chủ (FR-HOME) | Dữ liệu tải đủ, pull-to-refresh | Token rỗng → về Đăng nhập |
| Dịch vụ (FR-SVC) | Giá cập nhật theo tùy chọn | Giờ ngoài khoảng, thiếu tùy chọn bắt buộc |
| Đặt lịch (FR-BOOK) | Tạo đơn thành công, phân trang | Ngày trong quá khứ, thiếu địa chỉ, hủy sai trạng thái |
| Thanh toán (FR-PAY) | Thẻ mặc định, tiền mặt, KM, điểm | Mã KM sai, điểm vượt số dư, thẻ bị xóa giữa chừng |
| Thông báo (FR-NOTI) | Đọc/xóa/badge/deep link | Inbox rỗng, mất mạng khi tải |
| Hồ sơ (FR-PRO) | Sửa hồ sơ, sổ địa chỉ | Ảnh lớn, xóa địa chỉ đang dùng |
| Gói dịch vụ (FR-SUB) | Bật/tắt gia hạn, hủy | Hủy gói rồi đặt đơn mới (giá về gốc) |

## 5. Kiểm thử phi chức năng

Thực hiện checklist [NFR](/docs/yeu-cau-phi-chuc-nang/) mỗi bản release: mất mạng, token hết hạn giữa phiên, đổi ngôn ngữ, xoay/thu nhỏ màn hình, thiết bị yếu.

## 6. Hộp kiểm tự động (để tester biết CI đang chặn gì)

Mỗi thay đổi mã nguồn chạy tự động: typecheck, **290 test đơn vị** (42 bộ), sàn độ phủ 50%+, ngân sách `any` ≤ 47, `expo-doctor` 21/21. Tester vẫn phải kiểm tra **trải nghiệm thật trên thiết bị** — bộ tự động không thay thế được kiểm thử UI.

## 7. Báo cáo lỗi

Mỗi bug ghi kèm: thiết bị + hệ điều hành, ngôn ngữ app, môi trường, bước tái hiện, kỳ vọng theo `FR-/BL-` tương ứng, ảnh/quay màn hình.
