---
title: "FR — Tài khoản & xác thực"
weight: 10
---

# FR-ACC — Tài khoản & xác thực

## FR-ACC-01 · Đăng ký tài khoản · Ưu tiên C

- **Mô tả:** Khách tạo tài khoản bằng email/số điện thoại và mật khẩu, sau đó bổ sung họ tên, giới tính, địa chỉ.
- **Điều kiện kích hoạt:** Chạm “Đăng ký” trên màn đăng nhập.
- **Luồng chính:** Nhập email + mật khẩu → hệ thống kiểm tra trùng lặp → tạo tài khoản → đăng nhập tự động → chuyển tới màn hồ sơ.
- **Tiêu chí chấp nhận:**
  - Email/số điện thoại đã tồn tại → báo lỗi “Tài khoản đã tồn tại”, không tạo tài khoản.
  - Mật khẩu dưới độ dài tối thiểu → báo lỗi tại ô nhập, không gửi yêu cầu.
  - Đăng ký thành công → token lưu lại, mở app lần sau không cần đăng nhập lại.

## FR-ACC-02 · Đăng nhập · C

- **Mô tả:** Đăng nhập bằng email/mật khẩu hoặc tài khoản Google.
- **Luồng chính:** Nhập thông tin → xác thực → về Trang chủ; thông báo đẩy đăng ký thiết bị sau đăng nhập.
- **Tiêu chí chấp nhận:**
  - Sai mật khẩu → báo lỗi chung “Email hoặc mật khẩu không đúng”, không tiết lộ trường nào sai.
  - Đăng nhập thành công → token hợp lệ được dùng cho mọi request kèm header `app_key`.
  - Đăng nhập Google bị hủy giữa chừng → quay về màn đăng nhập, không crash, không tạo phiên.

## FR-ACC-03 · Quên mật khẩu · H

- **Mô tả:** Người dùng nhận mã OTP để đặt lại mật khẩu.
- **Tiêu chí chấp nhận:** OTP sai/hết hạn → báo lỗi, cho nhập lại; đặt lại thành công → đăng nhập được bằng mật khẩu mới, mật khẩu cũ hết hiệu lực.

## FR-ACC-04 · Đổi mật khẩu · H

- **Tiêu chí chấp nhận:** Phải nhập mật khẩu hiện tại đúng; sau đổi, các phiên khác có thể bị yêu cầu đăng nhập lại.

## FR-ACC-05 · Phiên đăng nhập hết hạn · C

- **Mô tả:** Token hết hạn (mọi API trả 401) → ứng dụng tự đăng xuất.
- **Tiêu chí chấp nhận:**
  - Khi token hết hạn, thao tác bất kỳ → hiện cảnh báo “Phiên đăng nhập hết hạn” → về màn Đăng nhập.
  - Dữ liệu nháp ở màn hình không giữ lại.

## FR-ACC-06 · Đa ngôn ngữ · H

- **Tiêu chí chấp nhận:**
  - Đổi ngôn ngữ → toàn bộ nhãn màn hình đổi ngay, gọi API cập nhật ngôn ngữ lên server.
  - Ngôn ngữ được khôi phục sau khi đăng nhập lại. Tiếng Việt hiển thị dấu đầy đủ, không lỗi font.
