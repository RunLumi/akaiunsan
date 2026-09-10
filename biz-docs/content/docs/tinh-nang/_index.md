---
title: "Danh sách tính năng"
weight: 300
---

# Danh sách tính năng

Xem kèm [Danh mục màn hình](/docs/man-hinh/) — nơi mỗi tính năng được ánh xạ tới màn hình cụ thể của ứng dụng.

Tính năng được nhóm theo **hành trình của khách hàng**. Cột *Mã* dùng để tham chiếu chéo sang [Yêu cầu chức năng](/docs/yeu-cau-chuc-nang/) và [Kịch bản kiểm thử](/docs/kiem-thu/).

## 1. Tài khoản & xác thực

| Mã | Tính năng | Mô tả |
|---|---|---|
| `F-ACC-01` | Đăng ký tài khoản | Đăng ký bằng email/số điện thoại + mật khẩu, nhập thông tin cá nhân |
| `F-ACC-02` | Đăng nhập | Đăng nhập email/mật khẩu; hỗ trợ đăng nhập Google |
| `F-ACC-03` | Quên mật khẩu | Yêu cầu mã OTP qua email/số điện thoại để đặt lại mật khẩu |
| `F-ACC-04` | Đổi mật khẩu | Đổi mật khẩu khi đang đăng nhập |
| `F-ACC-05` | Phiên đăng nhập | Token hết hạn tự động đăng xuất và đưa về màn đăng nhập |
| `F-ACC-06` | Đa ngôn ngữ | Đổi ngôn ngữ VI/EN (mặc định VI), lưu lựa chọn giữa các phiên |

## 2. Khám phá dịch vụ

| Mã | Tính năng | Mô tả |
|---|---|---|
| `F-HOME-01` | Trang chủ | Banner khuyến mãi, dịch vụ nổi bật, dịch vụ yêu thích |
| `F-SVC-01` | Danh mục dịch vụ | 5 nhóm dịch vụ: Dọn nhà (Maid), Chăm sóc em bé (Nany), Chăm sóc người cao tuổi (Elder), Vệ sinh máy lạnh (AC), Chăm sóc thú cưng (Petcare) |
| `F-SVC-02` | Tùy chọn dịch vụ | Chọn số giờ, số lượng phòng, thú cưng, dịch vụ thêm (ủi đồ, dắt chó đi dạo…), helper đặc biệt |
| `F-SVC-03` | Bảng giá động | Giá hiển thị theo giờ và tùy chọn, có áp dụng ưu đãi gói dịch vụ |

## 3. Đặt lịch & đơn hàng

| Mã | Tính năng | Mô tả |
|---|---|---|
| `F-BOOK-01` | Chọn ngày giờ | Lịch chọn ngày + khung giờ bắt đầu (không cho chọn quá khứ) |
| `F-BOOK-02` | Chọn helper | Gợi ý helper phù hợp hoặc chọn từ danh sách helper yêu thích |
| `F-BOOK-03` | Chọn địa chỉ | Chọn địa chỉ đã lưu hoặc chọn vị trí trên bản đồ |
| `F-BOOK-04` | Tạo đơn | Xem lại thông tin, áp mã khuyến mãi/điểm, xác nhận tạo đơn |
| `F-BOOK-05` | Theo dõi đơn | Danh sách đơn s tới (upcoming) và lịch sử (history), làm mới kéo-tải |
| `F-BOOK-06` | Hủy đơn | Hủy đơn ở trạng thái được phép, kèm xác nhận |
| `F-BOOK-07` | Yêu cầu đặc biệt | Gửi yêu cầu đặc biệt cho đơn đã ghép helper |

## 4. Thanh toán

| Mã | Tính năng | Mô tả |
|---|---|---|
| `F-PAY-01` | Quản lý thẻ | Thêm/xóa thẻ tín dụng (qua Omise), đặt thẻ mặc định |
| `F-PAY-02` | Thanh toán bằng thẻ | Trừ tiền thẻ mặc định khi tạo đơn |
| `F-PAY-03` | Thanh toán tiền mặt | Chọn thanh toán bằng tiền mặt cho đơn vẫn dùng |
| `F-PAY-04` | Khuyến mãi | Nhập mã khuyến mãi, giảm tiền hoặc giảm phần trăm |
| `F-PAY-05` | Điểm thưởng | Dùng điểm tích lũy để giảm giá đơn hàng |

## 5. Thông báo & tài khoản

| Mã | Tính năng | Mô tả |
|---|---|---|
| `F-NOTI-01` | Hộp thông báo | Hai tab: Thông báo (đơn hàng) và Khuyến mãi; phân trang, đánh dấu đã đọc |
| `F-NOTI-02` | Badge chưa đọc | Số chưa đọc hiển thị trên tab Inbox của ứng dụng |
| `F-NOTI-03` | Xem chi tiết | Chạm thông báo mở thẳng chi tiết đơn/khuyến mãi (deep link) |
| `F-PRO-01` | Hồ sơ cá nhân | Xem/sửa họ tên, giới tính, ngày sinh, ảnh đại diện |
| `F-PRO-02` | Sổ địa chỉ | Thêm/sửa/xóa địa chỉ, chọn vị trí trên bản đồ, đặt địa chỉ mặc định |
| `F-FAV-01` | Yêu thích | Đánh dấu dịch vụ và helper yêu thích để đặt lại nhanh |
| `F-HIST-01` | Lịch sử & đánh giá | Xem đơn đã hoàn thành, đánh giá sao helper |
| `F-SUB-01` | Gói dịch vụ | Gói Linh hoạt (Flexible) và Gói cố định (Fix): mua, gia hạn tự động, hủy |
| `F-REF-01` | Giới thiệu bạn bè | Chia sẻ mã giới thiệu, nhận ưu đãi khi bạn bè dùng dịch vụ |

## 6. Quản trị (Admin)

| Mã | Tính năng | Mô tả |
|---|---|---|
| `F-ADM-01` | Quản lý dịch vụ & giá | Cấu hình dịch vụ, tùy chọn, bảng giá theo giờ |
| `F-ADM-02` | Quản lý helper | Duyệt helper, trạng thái hoạt động |
| `F-ADM-03` | Quản lý đơn | Theo dõi toàn bộ đơn, xử lý khiếu nại |
| `F-ADM-04` | Quản lý khuyến mãi | Tạo mã, loại giảm giá, thời hạn, điều kiện |
