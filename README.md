# CustomerManagement.API — Bài thực hành Tuần 04

ASP.NET Core Web API (.NET 8) quản lý khách hàng, dùng SQL Server, EF Core, JWT và Swagger.

## Chuẩn bị

Tạo database SQL Server tên `CustomerManagementDB`. Trong thư mục project, cấu hình các giá trị riêng của máy bằng .NET User Secrets (không commit giá trị thật):

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=<SQL_SERVER_INSTANCE>;Database=CustomerManagementDB;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:Key" "<RANDOM_SECRET_AT_LEAST_32_BYTES>"
dotnet user-secrets set "SeedAdmin:Password" "<PRACTICE_PASSWORD>"
```

Sau đó chạy:

```powershell
dotnet tool restore
dotnet ef database update
dotnet run
```

Mở `http://localhost:5059/swagger` trong môi trường Development. Lần chạy đầu sẽ tạo tài khoản `admin` nếu chưa tồn tại; mật khẩu là giá trị `SeedAdmin:Password` đã cấu hình và chỉ được lưu dưới dạng BCrypt hash.

Đăng nhập tại `POST /api/auth/login`. Sao chép giá trị `token` và nhập **chỉ token** vào nút Authorize của Swagger; Swagger tự thêm tiền tố `Bearer`.

Các API Customer yêu cầu JWT: `GET /api/customers`, `GET /api/customers/{id}`, `POST /api/customers`, `PUT /api/customers/{id}` và `DELETE /api/customers/{id}`.
