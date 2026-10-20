# BookreadManagement

Ứng dụng đọc truyện gồm API ASP.NET Core 8 và giao diện HTML/CSS/JavaScript. API dùng SQL Server để lưu tài khoản, truyện và chương; giao diện được API phục vụ tại `/app/`.

## Cấu trúc

- `Backend/`: API, Entity Framework Core migrations và hướng dẫn cấu hình.
- `Frontend/`: trang khám phá, tìm truyện, chi tiết truyện, tài khoản và quản trị.

## Chạy trên máy cá nhân

Cần .NET 8 SDK và SQL Server. Trong PowerShell:

```powershell
cd Backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=<SQL_SERVER_INSTANCE>;Database=CustomerManagementDB;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:Key" "<RANDOM_SECRET_AT_LEAST_32_BYTES>"
dotnet tool restore
dotnet ef database update
dotnet run --launch-profile http
```

Mở `http://localhost:5059/app/` để xem truyện, tìm theo tên và mở chi tiết. Mở `http://localhost:5059/app/account.html` để đăng ký/đăng nhập. Tài khoản Admin có thể quản lý khách hàng ở `/app/admin.html` và truyện, chương ở `/app/admin-stories.html`.

Xem [hướng dẫn Backend](Backend/README.md) và [cấu trúc Frontend](Frontend/README.md) để biết thêm về API và cách tổ chức mã nguồn. Không commit connection string, JWT key hoặc mật khẩu; các giá trị này được cấu hình bằng .NET User Secrets hoặc biến môi trường.
