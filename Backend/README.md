# Backend — CustomerManagement.API

ASP.NET Core Web API trên .NET 8, dùng SQL Server, EF Core, JWT và Swagger. Khi đã build React, backend phục vụ ứng dụng trong `../Frontend/WebApp/dist` tại `/app/`. Trong lúc phát triển, chạy React bằng Vite theo hướng dẫn ở [Frontend](../Frontend/README.md).

## Thiết lập

Cài .NET 8 SDK và SQL Server, rồi cấu hình riêng trên máy bằng User Secrets:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=<SQL_SERVER_INSTANCE>;Database=CustomerManagementDB;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:Key" "<RANDOM_SECRET_AT_LEAST_32_BYTES>"
# Tùy chọn: mật khẩu để seed admin trong Development
dotnet user-secrets set "SeedAdmin:Password" "<PRACTICE_PASSWORD>"
dotnet tool restore
dotnet ef database update
dotnet run
```

Mặc định profile HTTP chạy tại `http://localhost:5059`. Mở Swagger ở `/swagger` và frontend ở `/app/`. Không commit connection string, JWT key hoặc mật khẩu.

## API

- `GET /api/stories`: danh sách; hỗ trợ `search`/`keyword`, `genreId`, `status`, `sort`, `page`, `pageSize`.
- `GET /api/stories/{id}`, `GET /api/stories/{id}/chapters`: chi tiết và mục lục.
- `GET /api/stories/{storyId}/chapters/{number}`: nội dung chương đã phát hành; tăng lượt đọc.
- `GET /api/genres`: danh sách thể loại.
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`: tài khoản và xác thực.
- `/api/customers`, `/api/stories`, `/api/genres` (ghi), và quản lý chương yêu cầu JWT role `Admin`.
- `GET /api/health`: trạng thái API/database.

Các API admin cho phép thêm/sửa/xóa truyện, chương và thể loại. Chương có nội dung, cờ miễn phí và thời điểm phát hành. Các chương cũ chưa có nội dung được đánh dấu “Đang biên soạn” và chưa mở đọc được.

## Migration

Sau khi cập nhật mã nguồn, chạy `dotnet ef database update`. Migration `AddReaderAndGenres` bổ sung nội dung chương, lịch phát hành, lượt đọc, thời gian cập nhật truyện và bảng thể loại. Migration tạo dữ liệu mẫu cho thể loại và nội dung chương đầu để có thể thử luồng đọc ngay; admin có thể cập nhật hoặc bổ sung nội dung trong trang quản lý.
