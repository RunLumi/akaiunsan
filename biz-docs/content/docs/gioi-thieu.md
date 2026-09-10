---
title: "Giới thiệu"
weight: 100
---

# Giới thiệu AKAIUNSAN

## 1. Nền tảng là gì?

**AKAIUNSAN** là nền tảng trung gian kết nối **Khách hàng** có nhu cầu chăm sóc nhà cửa với các **Người trợ giúp (Helper)** đã được xác minh. Khách hàng đặt lịch theo giờ, hệ thống gợi ý helper phù hợp, theo dõi tiến trình đơn hàng, thanh toán bằng thẻ hoặc tiền mặt và đánh giá sau dịch vụ.

## 2. Các bề mặt sản phẩm

| Bề mặt | Công nghệ | Đối tượng | Mục đích |
|---|---|---|---|
| Ứng dụng di động (`apps/`) | React Native + Expo | Khách hàng | Đặt lịch, thanh toán, theo dõi, đánh giá |
| Trang web (`frontend/`) | Web | Khách hàng / Tiếp thị | Giới thiệu, landing page dịch vụ |
| Trang quản trị (`admin/`) | React + Vite | Quản trị viên | Quản lý dịch vụ, helper, đơn hàng, khuyến mãi |
| API (`backend/`) | Express 5 + Sequelize + MariaDB | Hệ thống | Toàn bộ logic dữ liệu và nghiệp vụ |

## 3. Ai nên đọc tài liệu này?

- **Ban lãnh đạo / Sản phẩm:** mục [Tổng quan hệ thống](/docs/tong-quan-he-thong/), [Danh sách tính năng](/docs/tinh-nang/), [Yêu cầu chức năng](/docs/yeu-cau-chuc-nang/).
- **Lập trình viên:** toàn bộ mục [Nghiệp vụ hệ thống](/docs/nghiep-vu/) — mỗi quy tắc `BL-` là hợp đồng hành vi cần triển khai đúng.
- **Kiểm thử viên:** [Yêu cầu chức năng](/docs/yeu-cau-chuc-nang/) (tiêu chí chấp nhận) + [Hướng dẫn kiểm thử](/docs/kiem-thu/).
- **Người dùng cuối:** [Hướng dẫn sử dụng](/docs/huong-dan-su-dung/) — ngôn ngữ đời thường, không thuật ngữ kỹ thuật.

## 4. Nguyên tắc ngôn ngữ

Ứng dụng hỗ trợ đa ngôn ngữ (**Tiếng Việt** — ngôn ngữ mặc định, **Tiếng Anh**). Tài liệu này viết bằng tiếng Việt là ngôn ngữ chuẩn; thuật ngữ kỹ thuật giữ nguyên tiếng Anh kèm giải thích ở [Bảng thuật ngữ](/docs/thuattu/).
