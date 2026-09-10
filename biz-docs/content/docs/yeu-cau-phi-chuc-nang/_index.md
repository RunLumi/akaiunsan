---
title: "Yêu cầu phi chức năng"
weight: 500
---

# Yêu cầu phi chức năng (Non-functional Requirements)

Các yêu cầu phi chức năng là **điều kiện chất lượng** áp cho toàn hệ thống. Tester kiểm tra chúng như các hạng mục nghiệm thu độc lập với tính năng.

| Mã | Nhóm | Yêu cầu | Thước đo kiểm chứng |
|---|---|---|---|
| `NFR-01` | Hiệu năng | Màn hình chính hiển thị dữ liệu sẵn sàng tương tác trong vòng ~2 giây trên thiết bị tầm trung; thao tác cuộn 60fps không giật khung hình | Đo thủ công trên máy tầm trung + theo dõi Sentry performance |
| `NFR-02` | Bảo mật | API xác thực bằng JWT hợp lệ; không khóa/mật khẩu/secret nào nằm trong mã nguồn; thẻ tín dụng chỉ lưu 4 số cuối | Rà soát cấu hình, quét mã nguồn, kiểm thử 401 |
| `NFR-03` | Sẵn sàng | Lỗi nghiêm trọng (crash) được ghi về Sentry kèm bản đồ ngăn xếp; lỗi API hiển thị thông báo thân thiện, không crash ứng dụng | Kích hoạt lỗi thử nghiệm, xem báo cáo |
| `NFR-04` | Đa ngôn ngữ | Tiếng Việt, tiếng Anh, tiếng Thái; tiếng Việt hiển thị dấu chuẩn; đổi ngôn ngữ không cần cài lại | Kiểm tra toàn màn hình ở 3 ngôn ngữ |
| `NFR-05` | Giao diện nhất quán | Tuân thủ DESIGN.md “Living Standard”: nền giấy `#f9f8f3`, mực `#20251b`, nhấn lime `#c7dc50`; chữ trên nền lime luôn màu Ink; không bóng xám/đen thuần | Rà soát thiết kế đối chiếu DESIGN.md |
| `NFR-06` | Tương thích | iOS và Android (React Native/Expo); mọi màn hình không tràn ngang; mục tiêu chạm ≥ 44px | Ma trận thiết bị trong [Hướng dẫn kiểm thử](/docs/kiem-thu/) |
| `NFR-07` | Khả năng kiểm thử | Bộ kiểm thử tự động phải xanh trước khi nhận bản dựng mới; chặn sàn độ phủ và ngân sách `any` được CI tự động thi hành | `yarn typecheck`, `yarn test`, `ci/check-floors.js` |
| `NFR-08` | Quan sát | Hành vi người dùng ghi log phân tích (analytics); lỗi mạng hiển thị trạng thái trống/thông báo, không treo màn hình | Kiểm tra bảng điều trị Sentry/Analytics |
| `NFR-09` | Khả năng truy cập | Văn bản tương phản tối thiểu AA; hỗ trợ giảm chuyển động (`prefers-reduced-motion`); điểm nhấn focus luôn hiển thị | Đối chiếu DESIGN.md §2.4, §7.7 |
| `NFR-10` | Dữ liệu cá nhân | Thông tin cá nhân chỉ hiển thị phần cần thiết; xóa tài khoản/địa chỉ phải qua xác nhận | Rà soát luồng xóa + xác nhận |

## Ghi chú kiểm chứng nhanh cho tester

1. **NFR-02:** tắt mạng rồi thao tác — ứng dụng phải hiện thông báo lỗi mạng, không đóng bất ngờ.
2. **NFR-04:** đổi sang tiếng Anh rồi về tiếng Việt — không còn nhãn tiếng Anh sót lại ở màn chính.
3. **NFR-05:** mọi nút chính màu lime phải có chữ màu Ink (không phải trắng), mọi bóng đổ có sắc olive.
