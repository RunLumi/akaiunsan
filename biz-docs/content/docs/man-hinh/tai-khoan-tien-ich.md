---
title: "Màn hình — Tài khoản & tiện ích"
weight: 50
---

# Màn hình tài khoản & tiện ích

## EditProfile — Sửa hồ sơ

- **Tệp:** `Other/EditProfile.tsx` · **FR:** FR-PRO-01
- **Thành phần:** ảnh đại diện (chụp/chọn thư viện), họ tên, giới tính, email, số điện thoại (validate), địa chỉ.
- **Lỗi:** số điện thoại/email sai định dạng → nhãn lỗi; lưu xong → hồ sơ trên Trang chủ cập nhật.

## Payment/List — Quản lý thẻ

- **Tệp:** `Payment/PaymentList.tsx` · **FR:** FR-PAY-01
- **Thành phần:** danh sách thẻ (4 số cuối, tên, hạn), radio thẻ mặc định, nút xóa có xác nhận, nút **Add** mở modal Omise (AddCardPayment).
- **Trạng thái:** rỗng → nhãn “chưa có thẻ” + nút thanh toán vô hiệu.

## Address & Address/Pick — Sổ địa chỉ

- **Tệp:** `Address/Address.tsx`, `Address/PickAddress.tsx` · **FR:** FR-PRO-02
- **Address:** danh sách địa chỉ đã lưu — thêm/sửa/xóa, đặt mặc định.
- **Pick:** nhập tìm gợi ý hoặc chọn điểm trên bản đồ → trả tọa độ + địa chỉ về màn gọi.

## Favourite — Yêu thích

- **`Favourite/Menu`** (`Favourite/Menu.tsx`): hai lựa chọn — Dịch vụ yêu thích / Helper yêu thích.
- **`Favourite/Service`** (`Favourite/Service.tsx`): danh sách dịch vụ đã thích; chạm → mở dịch vụ; trái tim → bỏ thích.
- **`Favourite/ServiceProvider`** (`Favourite/ServiceProvider.tsx`): danh sách helper đã thích; hỗ trợ xóa hàng loạt (checkbox).

## InboxDetail — Chi tiết thông báo

- **Tệp:** `Other/InboxDetail.tsx` · **FR:** FR-NOTI-01
- Hiển thị tiêu đề, thời gian (đổi múi giờ về Việt Nam), nội dung; thông báo đơn hàng kèm chi tiết giờ làm (đổi ra số giờ).

## PreferToFriend — Giới thiệu bạn bè

- **Tệp:** `Other/PreferToFriend.tsx` · **FR:** FR-REF-01
- Danh sách người được giới thiệu (không trùng theo userId), nút chia sẻ; phân trang khi tải thêm.

## AboutUs (+ AboutUs/View) — Về chúng tôi

- **Tệp:** `Other/AboutUs.tsx`
- `AboutUs` nhận `url` từ route params và mở trong WebView; `AboutUs/View` là biến thể xem nội dung tĩnh (điều khoản, chính sách).
