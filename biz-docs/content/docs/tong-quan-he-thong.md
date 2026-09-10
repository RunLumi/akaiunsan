---
title: "Tổng quan hệ thống"
weight: 200
---

# Tổng quan hệ thống

## 1. Sơ đồ kiến trúc mức cao

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Ứng dụng khách  │   │   Trang quản trị │   │    Trang web     │
│  hàng (iOS/      │   │   (admin/)       │   │    (frontend/)   │
│  Android apps/)  │   │                  │   │                  │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │        HTTPS + JWT│              │
         └──────────────┬────────┴──────────────────────┘
                        ▼
              ┌───────────────────┐        ┌──────────────┐
              │  Backend API      │◄──────►│  MariaDB     │
              │  (Express 5)      │        │  (Dữ liệu)   │
              └─────┬───────┬─────┘        └──────────────┘
                    │       │
        ┌───────────▼──┐  ┌─▼──────────────────────┐
        │ Omise (thẻ)  │  │ Firebase FCM (thông báo)│
        └──────────────┘  └────────────────────────┘
```

## 2. Thành phần chính

| Thành phần | Vai trò | Ghi chú |
|---|---|---|
| **API Backend** | Mọi nghiệp vụ: tài khoản, đơn hàng, giá, khuyến mãi, thông báo | Bảo vệ bằng JWT |
| **Ứng dụng khách hàng** | Điểm chạm chính của khách hàng | Hỗ trợ iOS & Android, đa ngôn ngữ |
| **Trang quản trị** | Quản lý nội dung, helper, đơn, khuyến mãi | Dành cho nhân viên vận hành |
| **Omise** | Cổng thanh toán thẻ tín dụng/ghi nợ | Lưu thẻ an toàn theo chuẩn PCI |
| **Firebase FCM** | Thông báo đẩy realtime | Kèm badge số lượng chưa đọc |

## 3. Môi trường

| Môi trường | Dùng để | Dữ liệu |
|---|---|---|
| **Dev** | Phát triển tính năng mới | Dữ liệu giả lập |
| **Staging** | Kiểm thử chấp nhận (UAT) | Dữ liệu giống production, đã ẩn danh |
| **Production** | Khách hàng thật | Dữ liệu thật — chỉ vận hành mới được vào |

## 4. Vai trò người dùng

| Vai trò | Mô tả | Hành động chính |
|---|---|---|
| **Khách hàng (Customer)** | Người đặt dịch vụ | Đăng ký, đặt lịch, thanh toán, đánh giá |
| **Helper (Người trợ giúp)** | Người thực hiện dịch vụ | Nhận việc, cập nhật tiến trình |
| **Quản trị viên (Admin)** | Nhân viên vận hành nền tảng | Quản lý helper, giá, khuyến mãi, xử lý khiếu nại |
| **Khách (Guest)** | Chưa đăng nhập | Xem trang giới thiệu, dịch vụ; phải đăng ký để đặt lịch |
