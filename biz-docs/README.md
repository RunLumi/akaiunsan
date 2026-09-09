# biz-docs — Tài liệu nghiệp vụ AKAIUNSAN (Hugo)

Site tài liệu nghiệp vụ tiếng Việt: yêu cầu chức năng (FR), phi chức năng (NFR),
quy tắc nghiệp vụ (BL), danh sách tính năng (F) và hướng dẫn kiểm thử (TC).
Tham chiếu thiết kế: [DESIGN.md](../DESIGN.md) ("Living Standard").

## Xem trực tuyến

Site được GitHub Pages tự dựng qua `.github/workflows/biz-docs.yml` tại:
**https://streamentry.github.io/akaiunsan/**

## Build local

```bash
# yêu cầu Hugo extended ≥ 0.165
cd biz-docs
hugo server --bind 127.0.0.1 --port 1313
# mở http://localhost:1313/akaiunsan/
```

Build production: `hugo --gc --minify` (xuất ra `public/`, đã gitignore).

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `content/_index.md` | Trang chủ + quy ước mã định danh (F/FR/NFR/BL/TC) |
| `content/docs/gioi-thieu.md` | Giới thiệu nền tảng |
| `content/docs/tong-quan-he-thong.md` | Kiến trúc, môi trường, vai trò |
| `content/docs/tinh-nang/` | Danh sách tính năng `F-*` |
| `content/docs/yeu-cau-chuc-nang/` | Yêu cầu chức năng `FR-*` + tiêu chí chấp nhận |
| `content/docs/yeu-cau-phi-chuc-nang/` | Yêu cầu phi chức năng `NFR-*` |
| `content/docs/nghiep-vu/` | Quy tắc nghiệp vụ `BL-*` (trạng thái đơn, giá, khuyến mãi, gói, helper) |
| `content/docs/huong-dan-su-dung/` | Hướng dẫn cho người dùng cuối |
| `content/docs/kiem-thu/` | Hướng dẫn + quy ước test case cho tester |
| `content/docs/thuattu.md` | Bảng thuật ngữ |

## Thêm / sửa nội dung

1. Sửa trực tiếp file markdown trong `content/docs/` — dùng đúng tiền tố mã
   (`FR-`, `NFR-`, `BL-`, `F-`, `TC-`) để giữ traceability.
2. Mỗi FR mới cần: mô tả, luồng chính, tiêu chí chấp nhận, ưu tiên (C/H/M),
   và ít nhất 1 test case tương ứng trong mục Kiểm thử.
3. Pull request là bắt buộc; CI không rào nội dung — người review chịu trách
   nhiệm đối chiếu với DESIGN.md và các BL hiện có.

## Theme

hugo-book được **vendor** tại `themes/hugo-book/` (đã bỏ `.git`, không dùng
submodule). Ghi đè giao diện theo DESIGN.md tại `assets/_custom.scss` và
`layouts/_partials/docs/inject/head.html` (font Be Vietnam Pro / Manrope /
Spline Sans Mono). Không dùng mermaid (`static/mermaid.min.js` đã xóa —
bị pre-commit hook nhận nhầm là secret).
