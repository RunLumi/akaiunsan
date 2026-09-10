---
title: "Bảng thông điệp i18n"
weight: 20
---

# Bảng thông điệp i18n dùng khi kiểm thử

Tester đối chiếu thông báo trên UI với catalog dưới đây (nguồn: `apps/src/shared/I18n/en.ts|vi.ts` — 2 ngôn ngữ phải đồng bộ về tập khóa).

## Xác thực

| Khóa | Tiếng Anh (hiển thị) | Khi nào xuất hiện |
|---|---|---|
| `auth.register_success` | Account registered successfully | Đăng ký thành công |
| `auth.token_expired` | Token expired | JWT hết hạn → tự đăng xuất (FR-ACC-05) |
| `auth.error` | Something wrong | Tiêu đề hộp lỗi chung |
| `home.error_400` | Request failed with status code 400 | Lỗi 400 từ API (dữ liệu không hợp lệ) |

## Dịch vụ & đặt lịch

| Khóa | Tiếng Anh | Khi nào xuất hiện |
|---|---|---|
| `home.date_not_min` | You can not select day and time in past | Chọn ngày/giờ trong quá khứ (FR-BOOK-01) |
| `home.select_your_helper` | Select your helper | Xác nhận khi chưa chọn helper |
| `home.specify_helper` | Specific helper (if you have) | Nhãn phần helper đặc biệt |
| `home.suggest_for_you` | Suggest for you | Nhãn danh sách gợi ý |
| `home.select_age` | (chọn độ tuổi) | Nany: chưa chọn độ tuổi bé |

## Thanh toán & thẻ

| Khóa | Tiếng Anh | Khi nào xuất hiện |
|---|---|---|
| `home.add_card_success` | Add card success | Thêm thẻ thành công (FR-PAY-01) |
| `home.confirm_delete_card` | Confirm delete this card ? | Xác nhận xóa thẻ |
| `home.permission_camera` | (yêu cầu quyền) | Chụp ảnh thẻ/hồ sơ chưa cấp quyền |

## Thông báo & danh sách

| Khóa | Tiếng Anh | Khi nào xuất hiện |
|---|---|---|
| `home.data_empty` | Data empty | Trạng thái trống chung |
| `home.notification_empty` | Notification is empty | Tab Thông báo rỗng |
| `home.promotion_empty` | Promotion is empty | Tab Khuyến mãi rỗng |
| `home.confirm_delete` / `home.yes` / `home.no` | Confirm delete / Yes / No | Hộp xóa thông báo |
| `home.delete_successfully` | Delete successfully | Xóa thành công |
| `home.send_review_successfully` | Send review successfully | Gửi đánh giá (FR-HIST-01) |
| `home.copy_success` | Copy to clipboard success | Copy mã/thông tin |

## Quy tắc kiểm thử i18n

1. Mỗi thông báo trên UI phải có **khóa** tương ứng — không chấp nhận chuỗi cứng (hard-coded) mới.
2. Đổi ngôn ngữ → mọi khóa ở trên phải đổi theo; khóa thiếu bản dịch là bug (NFR-04).
3. Thông báo lỗi không được lộ chi tiết kỹ thuật (stack, SQL, đường dẫn).
