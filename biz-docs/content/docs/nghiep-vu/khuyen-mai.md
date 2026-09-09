---
title: "BL — Khuyến mãi"
weight: 30
---

# BL-PROMO — Khuyến mãi

## BL-PROMO-01 · Loại khuyến mãi

| Loại | Tên | Cách giảm |
|---|---|---|
| `GIFT_MONEY` | Tặng tiền | Trừ trực tiếp số tiền cấu hình khỏi giá đơn |
| `GIFT_PERCENT` | Tặng phần trăm | Trừ `%` trên giá đơn (tính trên thành giá trước khuyến mãi) |

## BL-PROMO-02 · Điều kiện áp dụng

1. Mã còn trong thời hạn hiệu lực.
2. Giá đơn đạt mức tối thiểu (nếu cấu hình).
3. Một đơn chỉ áp **một** mã khuyến mãi.
4. Khuyến mãi áp **trước** khi tính điểm thưởng (giảm giá làm thay đổi phần điểm quy đổi).

## BL-PROMO-03 · Thứ tự tính tiền

```
Thành tiền = Giá gốc (BL-PRICE-01)
           − Ưu đãi gói dịch vụ (BL-PRICE-02)
           − Khuyến mãi (BL-PROMO-01)
           − Điểm quy đổi (BL-POINT-01)
```

Khuyến mãi **không hoàn thành tiền mặt**; giá trị giảm không vượt thành tiền (tối đa về 0₫).

## BL-PROMO-04 · Hiển thị

- Thông báo khuyến mãi/news hiển thị ở tab Khuyến mãi của Inbox, chạm vào mở trang chi tiết.
- Banner khuyến mãi trên Trang chủ bấm vào mở cùng trang chi tiết đó.
