---
title: "BL — Gói dịch vụ"
weight: 40
---

# BL-SUB — Gói dịch vụ (Subscription)

## BL-SUB-01 · Hai loại gói

| Loại | Tên | Bản chất |
|---|---|---|
| **Flexible** | Gói linh hoạt | Mua một lượng giờ dùng dần cho một loại dịch vụ; đặt lịch nào cũng trừ giờ |
| **Fix** | Gói cố định | Lịch lặp cố định theo tuần (ví dụ 3 buổi/tuần), thường kèm helper cố định |

## BL-SUB-02 · Ưu đãi giá theo gói

- Đơn cùng loại dịch vụ với gói đang hiệu lực được áp **bảng giá ưu đãi của gói**.
- Ưu đãi chỉ áp cho phần giờ còn của gói; phần vượt giới hạn về giá gốc.
- Số giờ còn lại hiển thị cho khách khi cấu hình dịch vụ.

## BL-SUB-03 · Gia hạn tự động (toggle renew)

- Mỗi gói có công tắc **tự động gia hạn**: bật → khi chu kỳ kết thúc hệ thống gia hạn; tắt → gói kết thúc tự nhiên.
- Công tắc trong ứng dụng phải phản ánh đúng trạng thái server sau mỗi lần đổi (gọi API riêng cho flexible và fix).

## BL-SUB-04 · Hủy gói

- Hủy gói phải qua xác nhận; sau hủy, ưu đãi ngừng áp dụng cho **đơn mới** (đơn đã tạo không đổi giá).
- Hủy không hoàn lại phần giờ đã dùng.

## BL-SUB-05 · Quy tắc kết hợp

- Một khách có thể có **nhiều** gói cho nhiều loại dịch vụ, nhưng một đơn chỉ áp ưu đãi của **một** gói cùng loại dịch vụ.
- Gói và khuyến mãi có thể cùng áp cho một đơn (theo `BL-PROMO-03`).
