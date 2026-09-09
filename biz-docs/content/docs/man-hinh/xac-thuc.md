---
title: "Màn hình — Xác thực"
weight: 20
---

# Màn hình xác thực

Chỉ hiển thị khi **chưa có token**. Sau đăng nhập/đăng ký thành công, nhóm này rời khỏi ngăn xếp.

## Auth/Login — Đăng nhập

- **Tệp:** `Auth/Login.tsx` · **FR:** FR-ACC-02
- **Thành phần:** ô email + mật khẩu, nút **Sign In**, đăng nhập Google, quên mật khẩu, liên kết sang Đăng ký.
- **Hành động:** đăng nhập thành công → lưu token → Trang chủ → đăng ký token FCM + gọi cập nhật ngôn ngữ.
- **Lỗi:** sai thông tin (thông báo chung), hủy Google (quay lại màn hình), lỗi 400 (thông báo dịch i18n `home.error_400`).

## Auth/Signup — Đăng ký

- **Tệp:** `Auth/Signup.tsx` · **FR:** FR-ACC-01
- **Thành phần:** tên, họ, email, số điện thoại, mật khẩu, giới tính, nhà tài trợ (tùy chọn), đồng ý điều khoản.
- **Hành động:** submit hợp lệ → tạo tài khoản → đăng nhập → tới Trang chủ. Lỗi trùng email/biếu thuật → nhãn lỗi tại ô.

## Auth/ForgotPassword — Quên mật khẩu

- **Tệp:** `Auth/ForgotPassword.tsx` · **FR:** FR-ACC-03
- **Thành phần:** nhập email/SĐT → nhận OTP → nhập OTP + mật khẩu mới.
- **Lỗi:** OTP sai/hết hạn → cho nhập lại; đặt lại xong → về Login.
