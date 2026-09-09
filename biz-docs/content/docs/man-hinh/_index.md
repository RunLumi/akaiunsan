---
title: "Danh mục màn hình"
weight: 350
---

# Danh mục màn hình (Screens)

Mục liệt kê **toàn bộ 36 màn hình** của ứng dụng khách hàng, đúng theo định nghĩa route trong `apps/src/navigation/` và `Constants.SCREENS`. Mỗi màn hình được mô tả ở trang nhóm bên dưới; bảng này là bản đồ tổng.

## Luật truy cập

- **Auth gate:** chưa có token → chỉ vào được nhóm *Xác thực* (Login, Signup, ForgotPassword, Address/Pick). Có token → nhóm *Ứng dụng*.
- **Bottom tab** (`Main/BottomBar`) chứa 4 tab: Home, Booking, Inbox, Account.

## Bản đồ màn hình

### Tab chính

| Route | Tệp | Màn hình | FR |
|---|---|---|---|
| `Home` | `Main/Home.tsx` | Trang chủ | FR-HOME-01 |
| `Booking` | `Main/Booking.tsx` | Danh sách đơn (sắp tới / lịch sử) | FR-BOOK-05 |
| `Inbox` | `Main/Inbox.tsx` | Hộp thông báo | FR-NOTI-01..03 |
| `Account` | `Main/Account.tsx` | Tài khoản (menu trung tâm) | FR-PRO-01 |

### Xác thực

| Route | Tệp | Màn hình | FR |
|---|---|---|---|
| `Auth/Login` | `Auth/Login.tsx` | Đăng nhập | FR-ACC-02 |
| `Auth/Signup` | `Auth/Signup.tsx` | Đăng ký | FR-ACC-01 |
| `Auth/ForgotPassword` | `Auth/ForgotPassword.tsx` | Quên mật khẩu (OTP) | FR-ACC-03 |

### Dịch vụ & đặt lịch

| Route | Tệp | Màn hình | FR |
|---|---|---|---|
| `Service` | `ServiceScreen/Service.tsx` | Cấu hình dịch vụ (wizard) | FR-SVC-02/03 |
| `AllService` | `ServiceScreen/AllService.tsx` | Tất cả dịch vụ | FR-SVC-01 |
| `EditAndReOrderAndEditService` | `EditAndReOrderServiceScreen/…` | Sửa / đặt lại dịch vụ | FR-BOOK-04 |
| `Booking/Calendar` | `Booking/Calendar.tsx` | Lịch theo tháng + khung giờ | FR-BOOK-01 |
| `Booking/BookingDetail` | `Booking/BookingDetail.tsx` | Chi tiết đơn (chờ/sắp tới) | FR-BOOK-04/06/07 |
| `Booking/DetailHistory` | `Booking/DetailHistory.tsx` | Chi tiết đơn lịch sử | FR-HIST-01 |
| `PaymentPetcare` | `Other/PaymentPetcare.tsx` | Thanh toán đơn Petcare/tiền mặt | FR-PAY-03 |

### Kế hoạch & ưu đãi

| Route | Tệp | Màn hình | FR |
|---|---|---|---|
| `FixPlan/AddFixPlan` | `Other/FixPlan/AddFixPlan.tsx` | Tạo gói cố định (Fix) | FR-SUB-01 |
| `FixPlan/PickAddress` | `Other/FixPlan/PickAddress.tsx` | Chọn địa chỉ + thời gian cho Fix plan | FR-SUB-01 |
| `FixPlan/ResultPayment` | `Other/FixPlan/ResultPayment.tsx` | Kết quả thanh toán gói | FR-PAY-02 |
| `FexiblePlan/ListPlan` | `Other/FexiblePlan/ListPlan.tsx` | Danh sách gói linh hoạt | FR-SUB-01 |
| `FexiblePlan/Detail` | `Other/FexiblePlan/Detail.tsx` | Chi tiết gói linh hoạt | FR-SUB-02/04 |
| `FexiblePlan/Agree` | `Other/FexiblePlan/Agree.tsx` | Xác nhận điều khoản gói | FR-SUB-01 |
| `AllSubscriptionPlan` | `Subscription/AllSubscriptionPlan.tsx` | Tất cả gói dịch vụ | FR-SUB-01 |
| `Subscription/Detail` | `Subscription/SubscriptionDetail.tsx` | Quản lý gói hiện tại | FR-SUB-03/04 |
| `Promotion/List` | `Promotion/PromotionList.tsx` | Danh sách khuyến mãi | FR-PAY-04 |
| `Promotion/Detail` | `Promotion/PromotionDetail.tsx` | Chi tiết khuyến mãi/news | FR-PAY-04 |

### Tài khoản & tiện ích

| Route | Tệp | Màn hình | FR |
|---|---|---|---|
| `EditProfile` | `Other/EditProfile.tsx` | Sửa hồ sơ | FR-PRO-01 |
| `Payment/List` | `Payment/PaymentList.tsx` | Quản lý thẻ | FR-PAY-01 |
| `Address` | `Address/Address.tsx` | Sổ địa chỉ | FR-PRO-02 |
| `Address/Pick` | `Address/PickAddress.tsx` | Chọn địa chỉ trên bản đồ | FR-PRO-02 |
| `Favourite` | `Favourite/Menu.tsx` | Menu yêu thích | FR-FAV-01 |
| `Favourite/Service` | `Favourite/Service.tsx` | Dịch vụ yêu thích | FR-FAV-01 |
| `Favourite/ServiceProvider` | `Favourite/ServiceProvider.tsx` | Helper yêu thích | FR-FAV-01 |
| `InboxDetail` | `Other/InboxDetail.tsx` | Chi tiết thông báo | FR-NOTI-01 |
| `PreferToFriend` | `Other/PreferToFriend.tsx` | Giới thiệu bạn bè | FR-REF-01 |
| `AboutUs` | `Other/AboutUs.tsx` | Về chúng tôi (+ chế độ xem nội dung `AboutUs/View`) | — |
| `MyBooking/List` | `MyBooking/ListMyBooking.tsx` | Danh sách việc đã đặt | FR-BOOK-05 |
| `MyBooking/Detail` | `MyBooking/ListMyBooking.tsx` (tái dùng BookingDetail) | Chi tiết việc đã đặt | FR-BOOK-05 |
| `History/List` | `History/HistoryList.tsx` | Lịch sử có bộ lọc ngày | FR-HIST-01 |
| `History/Detail` | `History/HistoryDetail.tsx` | Chi tiết lịch sử | FR-HIST-01 |

Chi tiết từng màn hình: [Tab chính](/docs/man-hinh/tab-chinh/) · [Xác thực](/docs/man-hinh/xac-thuc/) · [Dịch vụ & đặt lịch](/docs/man-hinh/dich-vu-dat-lich/) · [Kế hoạch & ưu đãi](/docs/man-hinh/ke-hoach-uu-dai/) · [Tài khoản & tiện ích](/docs/man-hinh/tai-khoan-tien-ich/)
