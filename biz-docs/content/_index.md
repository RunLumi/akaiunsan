---
title: "Trang chủ"
template: "home"
---

# AKAIUNSAN — Tài liệu nghiệp vụ

Chào mừng đến với tài liệu nghiệp vụ chính thức của nền tảng **AKAIUNSAN** — nền tảng kết nối dịch vụ chăm sóc nhà cửa (dọn nhà, chăm sóc em bé, chăm sóc người cao tuổi, vệ sinh máy lạnh, chăm sóc thú cưng) giữa **Khách hàng** và **Người trợ giúp (Helper)**.

Tài liệu được xây dựng theo chuẩn tài liệu nội bộ 2026: mọi yêu cầu và quy tắc nghiệp vụ đều có **mã định danh riêng** để doanh nghiệp, lập trình viên và kiểm thử viên cùng tham chiếu một cách thống nhất.

| Vai trò | Nên đọc |
|---|---|
| **Doanh nghiệp / Sản phẩm** | [Tổng quan hệ thống](/docs/tong-quan-he-thong/), [Danh sách tính năng](/docs/tinh-nang/), [Yêu cầu chức năng](/docs/yeu-cau-chuc-nang/) |
| **Người dùng ứng dụng** | [Hướng dẫn sử dụng](/docs/huong-dan-su-dung/) — đặt lịch, thanh toán, theo dõi đơn từng bước |
| **Kiểm thử viên (Tester)** | [Hướng dẫn kiểm thử](/docs/kiem-thu/) — mỗi FR gắn tiêu chí chấp nhận, mỗi nghiệp vụ có quy tắc BL để suy diễn test case |

## Quy ước mã định danh

| Tiền tố | Ý nghĩa | Ví dụ |
|---|---|---|
| `F-` | Tính năng (Feature) | `F-BOOK` — Đặt lịch dịch vụ |
| `FR-` | Yêu cầu chức năng (Functional Requirement) | `FR-ACC-01` |
| `NFR-` | Yêu cầu phi chức năng (Non-functional Requirement) | `NFR-02` |
| `BL-` | Quy tắc nghiệp vụ (Business Logic / Business Rule) | `BL-ORD-01` |
| `TC-` | Kịch bản kiểm thử (Test Case) | `TC-ACC-001` |

> Tài liệu này là **nguồn tham chiếu duy nhất** cho phạm vi nghiệp vụ của AKAIUNSAN. Mọi thay đổi phạm vi phải cập nhật vào đây trước khi phát triển.
