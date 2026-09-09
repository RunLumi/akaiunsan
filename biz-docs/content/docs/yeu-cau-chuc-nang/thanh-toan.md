---
title: "FR — Thanh toán"
weight: 40
---

# FR-PAY — Thanh toán

## FR-PAY-01 · Quản lý thẻ · C

- **Luồng chính:** Màn Thanh toán → “Thêm” → nhập thông tin thẻ (form Omise) → thẻ được lưu an toàn, chỉ hiển thị 4 số cuối.
- **Tiêu chí chấp nhận:**
  - Thêm thẻ thành công → thẻ xuất hiện trong danh sách, có thể đặt làm mặc định (vòng tròn chọn).
  - Xóa thẻ phải qua xác nhận; xóa thẻ mặc định → danh sách cập nhật, không còn thẻ mặc định.
  - Số thẻ đầy đủ không bao giờ hiển thị trong ứng dụng.

## FR-PAY-02 · Thanh toán bằng thẻ · C

- **Tiêu chí chấp nhận:** Tạo đơn với thẻ mặc định → hệ thống trừ tiền; đơn hiển thị đã thanh toán bằng thẻ.

## FR-PAY-03 · Thanh toán tiền mặt · H

- **Tiêu chí chấp nhận:** Chọn tiền mặt → đơn tạo thành công không trừ thẻ; helper/admin đối soát khi hoàn thành.

## FR-PAY-04 · Khuyến mãi · H

- **Tiêu chí chấp nhận:**
  - Mã hợp lệ → giảm tiền (`GIFT_MONEY`) hoặc giảm phần trăm (`GIFT_PERCENT`) theo `BL-PROMO-01`; hiển thị nhãn xác nhận và số tiền giảm.
  - Mã sai/hết hạn/không đạt điều kiện → báo lỗi rõ ràng, không giảm giá.

## FR-PAY-05 · Điểm thưởng · M

- **Tiêu chí chấp nhận:** Nhập điểm sử dụng → giá giảm theo tỷ lệ quy đổi `BL-POINT-01`; điểm không đủ hoặc vượt số dư → chặn và báo lỗi; điểm tương ứng bị trừ khi đơn hoàn tất.
