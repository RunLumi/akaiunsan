---
title: "Quản trị & vận hành"
weight: 660
---

# Trang quản trị & vận hành

## 1. Trang quản trị (admin)

Xây bằng React 19 + Vite + TanStack Router, chia theo phân hệ:

| Phân hệ | Nội dung chính |
|---|---|
| **Dashboard** | Tổng quan hoạt động |
| **Apps** | Quản lý ứng dụng/dịch vụ hiển thị cho khách |
| **Tasks** | Công việc/việc theo dõi |
| **Users** | Quản lý người dùng và helper |
| **Chats** | Trao đổi/hỗ trợ |
| **Settings** | Cấu hình hệ thống, phân quyền |

Mọi thao tác quản trị đi qua `/back-office/*` với JWT + `recordHistory` (ghi vết) + `checkPermission` (phân quyền theo phân hệ).

## 2. Quy trình vận hành hằng ngày

1. **Đầu ca:** xem Dashboard — đơn mới, đơn chờ ghép helper, khiếu nại.
2. **Trong ca:** xử lý đơn `PENDING` chưa có helper (ghép thủ công qua Users/Helper), duyệt helper mới, theo dõi đơn `ON_PROCESS`.
3. **Cuối ca:** đối soát thanh toán (thẻ qua Omise, tiền mặt theo đơn `COMPLETED`), xử lý hủy/hoàn theo `BL-ORD-02`.

## 3. Triển khai

| Thành phần | Cách chạy | Ghi chú |
|---|---|---|
| Backend + MariaDB | Docker Compose trên VPS (`deploy/`) | Caddy làm ingress, tự TLS |
| Admin / Web | Build tĩnh qua CI | Được Caddy phục hồi |
| Mobile | Phát hành qua cửa hàng theo profile (`apps/scripts/deploy-stores.sh`) | Bản dựng kiểm thử qua EAS/maestro theo kế hoạch |
| Tài liệu này | GitHub Pages / Cloudflare Pages (xem `biz-docs/README.md`) | Tự dựng khi `biz-docs/**` thay đổi |

Chi tiết vận hành VPS: [deploy/README.md](../deploy/README.md).
