# Frontend

Giao diện web dùng React, Vite, Tailwind CSS, React Router và Axios. `WebApp` là
ứng dụng web duy nhất của dự án.

## Chạy ở chế độ phát triển

Khởi động backend trước theo [Backend/README.md](../Backend/README.md), tại
`http://localhost:5059`. Mở terminal khác:

```powershell
cd Frontend/WebApp
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:5173/app/`. Vite lắng nghe trên mạng nội bộ và proxy các
API từ `/api` sang backend.

## Build để backend phục vụ

```powershell
cd Frontend/WebApp
npm.cmd run build
```

Build được tạo ở `WebApp/dist`. Khi thư mục này tồn tại, ASP.NET Core phục vụ
ứng dụng tại `http://localhost:5059/app/` và trả `index.html` cho các route
React Router. Nếu backend đang chạy, khởi động lại sau khi build để backend
nhận thư mục mới. Nếu chưa build, chạy giao diện bằng Vite ở chế độ phát triển.

## Cấu trúc mã nguồn

- `src/api`: Axios client, JWT interceptor và endpoint wrappers.
- `src/services`: luồng chức năng, kiểm tra form và chuẩn hóa dữ liệu.
- `src/context`: phiên đăng nhập dùng chung.
- `src/components`: header, bìa truyện, thẻ truyện, trạng thái và route bảo vệ.
- `src/layouts`: bố cục admin.
- `src/pages`: khám phá, chi tiết, đọc, tài khoản và các trang quản trị.
- `src/utils`: định dạng dữ liệu.

Trang hồ sơ hỗ trợ cập nhật tên hiển thị, avatar URL và mật khẩu. Admin có các trang quản lý truyện/chương, thể loại, gói đọc và thống kê lượt đọc. Quyền chương được API quyết định; giao diện chỉ mở chương khi API xác nhận quyền đọc.
