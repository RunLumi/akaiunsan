---
title: "Màn hình — Dịch vụ & đặt lịch"
weight: 30
---

# Màn hình dịch vụ & đặt lịch

## Service — Cấu hình dịch vụ (wizard)

- **Tệp:** `ServiceScreen/Service.tsx` · **FR:** FR-SVC-02/03
- **Thành phần:** 3 bước — (1) tùy chọn dịch vụ (giờ, phòng/thú, extra services), (2) ngày giờ + helper + địa chỉ, (3) thanh toán & xác nhận.
- **Trạng thái:** giá cập nhật realtime; khối slider giờ ép khoảng cách tối thiểu 2h; nút bấm qua các bước có validate.
- **Đi:** tạo đơn thành công → thông báo + về danh sách đơn; thanh toán thẻ qua Omise.

## AllService — Tất cả dịch vụ

- **Tệp:** `ServiceScreen/AllService.tsx` · **FR:** FR-SVC-01
- **Hành động:** chạm một dịch vụ → `Service` (wizard). Dùng để xem trọn danh mục khi Trang chủ chỉ hiển thị 5 mục.

## EditAndReOrderAndEditService — Sửa / đặt lại

- **Tệp:** `EditAndReOrderServiceScreen/EditAndReOrderService.tsx`
- **Mục đích:** cùng wizard bước 1–3 nhưng chạy **chế độ sửa** (điền sẵn dữ liệu đơn) hoặc **đặt lại dịch vụ** cho đơn cũ; bước 3 gọi API sửa đơn thay vì tạo mới.
- **Vào:** từ chi tiết đơn có hành động “Sửa/Đặt lại”.

## PaymentPetcare — Thanh toán Petcare / tiền mặt

- **Tệp:** `Other/PaymentPetcare.tsx` · **FR:** FR-PAY-03
- **Mục đích:** màn thanh toán riêng cho luồng petcare/đơn tiền mặt, hiển thị thời gian đã chọn và xác nhận thanh toán.

## Booking/Calendar — Lịch

- **Tệp:** `Booking/Calendar.tsx` · **FR:** FR-BOOK-01
- **Thành phần:** lịch tháng (đổi tháng qua mũi tên, ô hôm nay tô lime), dải khung giờ 06:00–21:00, job đã đặt hiển thị dạng khối trên lưới giờ.
- **Hành động:** chọn khung giờ hợp lệ → truyền ngày giờ về wizard; quá khứ bị chặn.

## Booking/BookingDetail — Chi tiết đơn

- **Tệp:** `Booking/BookingDetail.tsx` · **FR:** FR-BOOK-04/06/07
- **Thành phần:** bảng thông tin dịch vụ/giờ/địa chỉ, helper, giá & khuyến mãi, nút theo trạng thái (hủy, yêu cầu đặc biệt, xác nhận).
- **Lỗi:** hủy ở trạng thái không cho phép → Alert; thiếu dữ liệu → trạng thái trống.

## Booking/DetailHistory — Chi tiết đơn lịch sử

- **Tệp:** `Booking/DetailHistory.tsx` · **FR:** FR-HIST-01
- Giống BookingDetail nhưng chỉ đọc, cho đơn `COMPLETED/CANCEL`.

## History/List & History/Detail — Lịch sử có lọc ngày

- **Tệp:** `History/HistoryList.tsx`, `History/HistoryDetail.tsx` · **FR:** FR-HIST-01
- **Thành phần:** bộ chọn khoảng ngày (DateTimePicker) + danh sách đơn; chi tiết hiển thị số giờ dịch vụ (duration).

## MyBooking/List & MyBooking/Detail — Việc đã đặt

- **Tệp:** `MyBooking/ListMyBooking.tsx` (Detail tái dùng BookingDetail) · **FR:** FR-BOOK-05
- **Mục đích:** danh sách việc đã đặt để truy cập nhanh/hủy; hỗ trợ pull-to-refresh và xóa việc.
