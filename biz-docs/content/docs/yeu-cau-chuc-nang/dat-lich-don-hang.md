---
title: "FR — Đặt lịch & đơn hàng"
weight: 30
---

# FR-BOOK — Đặt lịch & đơn hàng

## FR-BOOK-01 · Chọn ngày giờ · C

- **Luồng chính:** Mở lịch → chọn ngày → chọn khung giờ bắt đầu (danh sách giờ từ ~06:00–21:00) → giờ kết thúc tự tính theo số giờ dịch vụ.
- **Tiêu chí chấp nhận:**
  - Chỉ được chọn ngày hôm nay trở đi; khung giờ đã quá hôm nay không chọn được.
  - Với đơn đặt cho ngày mai, giờ bắt đầu phải cách hiện tại tối thiểu theo quy định (`BL-BOOK-02`).
  - Chọn thời lượng lẻ 0.5 giờ (ví dụ 2.5h) hệ thống tự chỉnh về bước 2h nếu vi phạm khoảng cách tối thiểu giữa hai đầu slider.

## FR-BOOK-02 · Chọn helper · C

- **Luồng chính:** Hệ thống gọi gợi ý helper phù hợp (theo dịch vụ, địa chỉ, ngôn ngữ, thời gian) → hiển thị danh sách gợi ý và toàn bộ helper → chọn helper hoặc bỏ trống (để hệ thống ghép).
- **Tiêu chí chấp nhận:**
  - Danh sách gợi ý trống → vẫn cho tiếp tục, gửi danh sách helper rỗng.
  - Helper yêu thích hiển thị đánh dấu; helper được chọn hiển thị tên + ảnh + số sao.

## FR-BOOK-03 · Chọn địa chỉ · C

- **Tiêu chí chấp nhận:** Dùng địa chỉ đã lưu hoặc thêm mới (kể cả chọn điểm trên bản đồ); đơn phải có địa chỉ mới tạo được.

## FR-BOOK-04 · Tạo đơn · C

- **Luồng chính:** Xem lại (ngày giờ, địa chỉ, helper, tùy chọn, giá) → áp khuyến mãi/điểm (tùy chọn) → chọn phương thức thanh toán → xác nhận.
- **Tiêu chí chấp nhận:**
  - Tạo đơn thành công → đơn xuất hiện ở tab “Đang tới” với trạng thái `PENDING`, nhận thông báo.
  - Thanh toán thẻ thất bại → đơn không được tạo ở trạng thái hoàn tất; hiện cảnh báo lỗi.
  - Thiếu thông tin bắt buộc (ngày giờ, địa chỉ) → chặn xác nhận và nhấn mạnh ô thiếu.

## FR-BOOK-05 · Theo dõi đơn · C

- **Tiêu chí chấp nhận:**
  - Tab “Đang tới” liệt kê đơn theo trạng thái `PENDING → MATCH → ON_PROCESS → WAITING_CONFIRM → RECEIVED`; tab “Lịch sử” liệt kê `COMPLETED/CANCEL` kèm sao đánh giá và helper.
  - Kéo-tải làm mới; kéo xuống cuối tải trang tiếp theo (phân trang).
  - Chạm đơn → mở chi tiết với đầy đủ thông tin `BL-ORD-01`.

## FR-BOOK-06 · Hủy đơn · H

- **Tiêu chí chấp nhận:**
  - Chỉ hủy được ở trạng thái cho phép (tham chiếu `BL-ORD-02`); sau hủy, đơn chuyển `CANCEL` và rời khỏi “Đang tới”.
  - Mỗi hủy phải qua hộp xác nhận; hủy lý do được ghi nhận.

## FR-BOOK-07 · Yêu cầu đặc biệt · M

- **Tiêu chí chấp nhận:** Đơn ở trạng thái `MATCH` cho phép gửi yêu cầu đặc biệt cho helper; gửi xong hiện xác nhận.
