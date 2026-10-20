# Đọc Truyện — giao diện khám phá

Frontend tĩnh cho `CustomerManagement.API`, dùng HTML/CSS/JavaScript thuần.

## Cấu trúc

```text
Frontend/
├─ index.html, story.html, account.html, admin.html, admin-stories.html
├─ styles/             CSS nền và CSS theo trang
└─ js/
   ├─ api/             client.js xử lý request/response; các file còn lại khai báo endpoint
   ├─ core/            phiên đăng nhập và xử lý lỗi quyền Admin
   ├─ pages/           luồng chức năng, sự kiện và trạng thái của từng trang
   └─ ui/              tạo/cập nhật DOM và thông báo giao diện
```

Các trang nạp ES modules trực tiếp trong trình duyệt. Muốn đổi địa chỉ API hoặc cách xử lý lỗi HTTP, sửa `js/api/client.js`; muốn thêm endpoint, sửa file theo tài nguyên trong `js/api/`.

## Chạy

1. Cấu hình connection string và JWT key theo `../Backend/README.md`.
2. Trong thư mục `Backend` của repository, chạy `dotnet ef database update` rồi `dotnet run --launch-profile http`.
3. Mở `http://localhost:5059/app/`.

Migration `AddStoryCatalog` tạo bảng `Stories`, `Chapters` và lưu sẵn 6 truyện, 18 chương mẫu vào SQL Server. Trang chủ lấy danh sách từ `GET /api/stories`, tìm theo tên qua `GET /api/stories?search=...`. Trang chi tiết lấy `GET /api/stories/{id}` và `GET /api/stories/{id}/chapters`. Trang truyện có thể xem công khai, không cần đăng nhập.

`/app/account.html` giữ chức năng đăng ký/đăng nhập. Sau khi đăng nhập, người dùng về trang khám phá; tài khoản Admin vào `/app/admin.html` để quản lý khách hàng hoặc chọn **Sách / truyện** để mở `/app/admin-stories.html`. Tại đây có thể thêm, sửa, xóa truyện và quản lý số/tên chương. Các thay đổi lưu trực tiếp vào SQL Server và xuất hiện trên trang khám phá. JWT được lưu trong `sessionStorage` của tab và được xóa khi đăng xuất hoặc hết hạn. Backend phục vụ frontend tại `/app/`; nếu mở frontend từ máy chủ tĩnh ở cổng 5173, các trang gọi API tại `http://localhost:5059` qua CORS.
