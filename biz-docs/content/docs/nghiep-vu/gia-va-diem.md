---
title: "BL — Giá & điểm"
weight: 20
---

# BL-PRICE / BL-POINT — Giá và điểm thưởng

## BL-PRICE-01 · Thành giá cơ bản

```
Giá gốc = Đơn giá theo dịch vụ × Số giờ
        + Giá dịch vụ thêm (ủi, dắt chó…)
        + Phụ phí theo tùy chọn (số phòng / số thú / số người)
```

- Bảng giá theo từng loại dịch vụ do Quản trị viên cấu hình (`config-price`).
- Số giờ cho phép bước lẻ 0.5 giờ; hai đầu khoảng thời gian phải cách nhau tối thiểu 2 giờ.

## BL-PRICE-02 · Ưu đãi theo gói dịch vụ

- Khách có **gói còn giờ** được áp bảng giá ưu đãi riêng cho dịch vụ cùng loại (ví dụ gói dọn nhà ưu đãi cho đơn dọn nhà).
- Số giờ còn lại của gói giảm dần theo từng đơn áp gói; hết giờ thì về giá gốc.

## BL-POINT-01 · Quy đổi điểm

- Điểm quy đổi thành tiền theo tỷ lệ cấu hình hệ thống (`POINT.MONEY_CONVERT_POINT`).
- Khách chỉ dùng được điểm ≤ số dư hiện có; điểm dùng ghi giảm ngay khi tạo đơn.

## BL-POINT-02 · Tích điểm

- Đơn kết thúc thành công (`RECEIVED`/`COMPLETED`) sinh điểm thưởng cho khách.
- Đơn hủy không sinh điểm; điểm đã dùng cho đơn hủy được hoàn lại theo chính sách hoàn.

## Ví dụ bằng số

> Dọn nhà 3 giờ, đơn giá 150.000₫/giờ, dịch vụ thêm ủi đồ 50.000₫, có gói giảm 10%, dùng mã giảm 50.000₫:
> Giá gốc = 450.000 + 50.000 = 500.000₫ → sau gói (−10%) = 450.000₫ → sau mã (−50.000₫) = **400.000₫**.
