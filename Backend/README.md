# CustomerManagement.API — Bài thực hành Tuần 04

ASP.NET Core Web API (.NET 8) quản lý khách hàng, dùng SQL Server, EF Core, JWT và Swagger.

## Chuẩn bị

Tạo database SQL Server tên `CustomerManagementDB`. Trong thư mục project, cấu hình các giá trị riêng của máy bằng .NET User Secrets (không commit giá trị thật):

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=<SQL_SERVER_INSTANCE>;Database=CustomerManagementDB;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:Key" "<RANDOM_SECRET_AT_LEAST_32_BYTES>"
# Tùy chọn: chỉ đặt nếu muốn tạo tài khoản admin mẫu trong Development.
dotnet user-secrets set "SeedAdmin:Password" "<PRACTICE_PASSWORD>"
```

Sau đó chạy:

```powershell
dotnet tool restore
dotnet ef database update
dotnet run
```

Mở `http://localhost:5059/swagger` trong môi trường Development. Nếu có `SeedAdmin:Password`, lần chạy đầu sẽ tạo tài khoản `admin` nếu chưa tồn tại; mật khẩu chỉ được lưu dưới dạng BCrypt hash.

Nếu thư mục `Frontend` nằm cùng cấp với `Backend`, mở `http://localhost:5059/app/` để dùng giao diện. Giao diện này gọi API cùng origin và không cần Node/npm.

`POST /api/auth/register` nhận `username`, `email`, `password`, trả HTTP 201 với thông tin tài khoản (không có mật khẩu). Email và tên đăng nhập trùng trả HTTP 409; dữ liệu sai trả HTTP 400. `POST /api/auth/login` nhận `username` (có thể nhập tên đăng nhập hoặc email) và `password`; trả JWT, thời hạn và thông tin tài khoản. Sai thông tin trả HTTP 401, tài khoản bị khóa trả HTTP 403. Sau khi thêm migration, chạy `dotnet ef database update` trước khi gọi các endpoint.

Đăng nhập tại `POST /api/auth/login`. Sao chép giá trị `token` và nhập **chỉ token** vào nút Authorize của Swagger; Swagger tự thêm tiền tố `Bearer`.

Các API Customer yêu cầu JWT có role `Admin`: `GET /api/customers`, `GET /api/customers/{id}`, `POST /api/customers`, `PUT /api/customers/{id}` và `DELETE /api/customers/{id}`. Sau khi admin đăng nhập, mở `http://localhost:5059/app/admin.html` để quản lý khách hàng.

## Truyện và chương

Migration `AddStoryCatalog` tạo hai bảng `Stories` và `Chapters` trong SQL Server, kèm 6 truyện và 18 chương mẫu. Chạy `dotnet ef database update` sau khi cập nhật mã nguồn. Dữ liệu truyện được truy vấn trực tiếp qua EF Core, không dùng mảng giả lập ở frontend.

Các API đọc công khai:

- `GET /api/stories`: danh sách truyện, mới nhất trước; thêm `?search=<tên truyện>` để tìm theo tên (tối đa 200 ký tự).
- `GET /api/stories/{id}`: thông tin chi tiết, trả 404 nếu không có truyện.
- `GET /api/stories/{id}/chapters`: danh sách chương theo thứ tự, trả 404 nếu không có truyện.

Giao diện khám phá ở `http://localhost:5059/app/`, tài khoản ở `/app/account.html`, chi tiết ở `/app/story.html?id=<id>`. Nếu API đã chạy từ trước, khởi động lại để nạp các endpoint mới.

Quản trị sách/truyện ở `/app/admin-stories.html`. Các API ghi sau yêu cầu JWT có role `Admin`:

- `POST /api/stories`, `PUT /api/stories/{id}`, `DELETE /api/stories/{id}` để thêm, sửa, xóa truyện. Xóa truyện sẽ xóa các chương liên quan.
- `POST /api/stories/{id}/chapters`, `PUT /api/stories/{id}/chapters/{chapterId}`, `DELETE /api/stories/{id}/chapters/{chapterId}` để quản lý chương. Số chương không được trùng trong cùng truyện.
