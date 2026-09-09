---
title: "Màn hình — Kế hoạch & ưu đãi"
weight: 40
---

# Màn hình kế hoạch (plan) & ưu đãi

## FixPlan — Gói cố định

- **`FixPlan/AddFixPlan`** (`Other/FixPlan/AddFixPlan.tsx`): tạo gói Fix — chọn dịch vụ, số giờ mỗi buổi, ngày trong tuần (lặp), helper; nút giảm giờ phản hồi giá tức thời (BL-SUB-01).
- **`FixPlan/PickAddress`** (`Other/FixPlan/PickAddress.tsx`): chọn địa chỉ + thời gian từng buổi, gợi ý thêm 3 buổi kế tiếp (cùng khung giờ tuần kế); xác nhận gói kèm điểm/khuyến mãi (charges-plan).
- **`FixPlan/ResultPayment`** (`Other/FixPlan/ResultPayment.tsx`): trang kết quả sau thanh toán gói — tổng tiền, danh sách buổi đã đặt; nút về trang chủ.

## FexiblePlan — Gói linh hoạt

- **`FexiblePlan/ListPlan`** (`Other/FexiblePlan/ListPlan.tsx`): danh sách gói Flexible đang bán + gói hiện tại; vào chi tiết để mua/đồng ý.
- **`FexiblePlan/Detail`** (`Other/FexiblePlan/Detail.tsx`): chi tiết gói — giá, ưu đãi, công tắc tự động gia hạn (BL-SUB-03), nút mua (Agree) và hủy gói có lý do.
- **`FexiblePlan/Agree`** (`Other/FexiblePlan/Agree.tsx`): xác nhận điều khoản và chốt mua gói.

## Subscription — Quản lý gói

- **`AllSubscriptionPlan`** (`Subscription/AllSubscriptionPlan.tsx`): toàn bộ gói theo nhóm (Flexible/Fix), trạng thái hủy của từng mục.
- **`Subscription/Detail`** (`Subscription/SubscriptionDetail.tsx`): gói hiện tại; phần nội dung booking đang vô hiệu hóa (dead code giữ lại) — chỉ hiển thị hai nhãn dẫn tới gói.

## Promotion — Khuyến mãi

- **`Promotion/List`** (`Promotion/PromotionList.tsx`): danh sách khuyến mãi/news đang chạy.
- **`Promotion/Detail`** (`Promotion/PromotionDetail.tsx`): chi tiết khuyến mãi — gallery ảnh, nội dung HTML, điều kiện; là đích deep link của thông báo loại 1/2.
