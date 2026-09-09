---
title: "BL — Trạng thái đơn hàng"
weight: 10
---

# BL-ORD — Trạng thái đơn hàng

## BL-ORD-01 · Các trạng thái

Mã trạng thái dùng thống nhất trong API, ứng dụng và quản trị:

| Giá trị | Tên | Ý nghĩa | Ai chuyển đến |
|---|---|---|---|
| `0` | `PENDING` — Chờ xử lý | Khách vừa tạo đơn, chưa ghép helper | Khách hàng (khi tạo đơn) |
| `1` | `MATCH` — Đã ghép | Đã có helper nhận việc | Hệ thống / Quản trị viên |
| `2` | `COMPLETED` — Hoàn thành | Dịch vụ đã thực hiện xong | Hệ thống / Helper |
| `3` | `CANCEL` — Đã hủy | Đơn bị hủy | Khách hàng / Quản trị viên |
| `4` | `ON_PROCESS` — Đang làm | Helper đang thực hiện dịch vụ | Helper |
| `5` | `WAITING_CONFIRM` — Chờ xác nhận | Helper xong việc, chờ khách xác nhận | Helper |
| `6` | `RECEIVED` — Đã nghiệm thu | Khách xác nhận nhận kết quả | Khách hàng |

## BL-ORD-02 · Luật chuyển trạng thái

| Từ | Được phép sang | Điều kiện | Hệ quả |
|---|---|---|---|
| `PENDING` | `MATCH`, `CANCEL` | Có helper nhận / khách hủy | `MATCH` tạo thông báo cho khách; `CANCEL` rời danh sách đang tới |
| `MATCH` | `ON_PROCESS`, `CANCEL` | Đến giờ làm / khách hủy | `ON_PROCESS` khóa một số sửa đổi trên đơn |
| `ON_PROCESS` | `WAITING_CONFIRM` | Helper hoàn thành | Không cho hủy thông thường |
| `WAITING_CONFIRM` | `RECEIVED` | Khách xác nhận | Sinh điểm thưởng, cho phép đánh giá |
| `RECEIVED` | `COMPLETED` | Chốt sau nghiệm thu/đối soát | Đơn vào lịch sử vĩnh viễn |

**Hệ quả liên quan:**
- Chỉ đơn ở nhóm “đang tới” (`PENDING, MATCH, ON_PROCESS, WAITING_CONFIRM, RECEIVED`) hiển thị ở tab *Đang tới*; `COMPLETED` và `CANCEL` vào *Lịch sử*.
- Đánh giá sao chỉ hợp lệ trên đơn `COMPLETED` (`BL-ORD-03`).
- Điểm thưởng cộng khi đơn kết thúc thành công (`BL-POINT-02`).

## BL-ORD-03 · Đánh giá đơn

- Mỗi đơn hoàn thành cho phép **một** lượt đánh giá 1–5 sao.
- Sao hiển thị lại trong lịch sử; gửi lại phải cập nhật chứ không nhân bản.

## BL-ORD-04 · Yêu cầu đặc biệt

- Chỉ gửi được khi đơn ở `MATCH` (đã có helper); nội dung gắn với đơn và hiển thị cho helper.
