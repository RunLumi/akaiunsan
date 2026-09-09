---
title: "Quy trình dịch vụ đầu–cuối"
weight: 60
---

# Quy trình dịch vụ đầu–cuối

```
Đăng ký/Đăng nhập
      │
      ▼
Chọn dịch vụ & tùy chọn ──► Giá hiển thị tức thời (BL-PRICE-01)
      │
      ▼
Chọn ngày giờ (FR-BOOK-01) ──► Chọn/gợi ý helper (FR-BOOK-02, BL-HELP-01)
      │
      ▼
Chọn địa chỉ (FR-BOOK-03) ──► Xem lại & áp Khuyến mãi/Điểm (BL-PROMO-03)
      │
      ▼
Tạo đơn → trạng thái PENDING (BL-ORD-01) ──► Thanh toán thẻ/tiền mặt (FR-PAY)
      │
      ▼
Ghép helper → MATCH ──► (có thể gửi Yêu cầu đặc biệt, BL-ORD-04)
      │
      ▼
ON_PROCESS ──► WAITING_CONFIRM ──► Khách xác nhận → RECEIVED
      │
      ▼
Đánh giá sao (BL-ORD-03) + Tích điểm (BL-POINT-02) ──► COMPLETED
```

## Điểm chạm thông báo

| Sự kiện | Khách hàng nhận |
|---|---|
| Đơn được ghép helper (`MATCH`) | Thông báo đẩy + mục trong Inbox |
| Helper bắt đầu làm (`ON_PROCESS`) | Thông báo đẩy |
| Helper hoàn thành (`WAITING_CONFIRM`) | Thông báo yêu cầu xác nhận |
| Khuyến mãi / tin mới | Mục trong tab Khuyến mãi |

## Hủy & rủi ro

- Khách hủy ở `PENDING/MATCH` theo `BL-ORD-02`; chính sách phí hoàn do vận hành quyết định trên quản trị.
- Sau `ON_PROCESS`, hủy cần xử lý thủ công qua quản trị viên (liên hệ hỗ trợ).
