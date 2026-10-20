# BookreadManagement

Đồ án đọc truyện gồm backend ASP.NET Core 8, frontend web HTML/CSS/JavaScript và ứng dụng Android Kotlin/Jetpack Compose. Dữ liệu tài khoản, truyện, chương và thể loại được lưu trong SQL Server.

## Thành phần

- [Backend](Backend/README.md): API, JWT, EF Core và migration SQL Server.
- [Frontend/Web](Frontend/Web/README.md): khám phá, tìm kiếm, chi tiết, đọc truyện và trang admin.
- [Mobile](Mobile/README.md): ứng dụng Android Kotlin.

## Tài liệu dự án

- [Đặc tả yêu cầu phần mềm (SRS)](Docs/SRS.md)
- [Danh mục tài liệu, yêu cầu chức năng, dữ liệu/API và ma trận truy vết](Docs/README.md)

## Chạy Web và API

Cần .NET 8 SDK và SQL Server. Trong PowerShell:

```powershell
cd Backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=<SQL_SERVER_INSTANCE>;Database=CustomerManagementDB;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:Key" "<RANDOM_SECRET_AT_LEAST_32_BYTES>"
dotnet tool restore
dotnet ef database update
dotnet run
```

Mở:

- Web: http://localhost:5059/app/
- Đăng nhập/đăng ký: http://localhost:5059/app/account.html
- Admin quản lý truyện/chương: http://localhost:5059/app/admin-stories.html
- Admin quản lý thể loại: http://localhost:5059/app/admin-genres.html
- Swagger: http://localhost:5059/swagger

Tài khoản admin mẫu (nếu bật seed trong môi trường Development) cần cấu hình `SeedAdmin:Password` bằng User Secrets. Không commit connection string, JWT key hay mật khẩu.

## Chạy Android

Mở thư mục `Mobile` bằng Android Studio, cài Android SDK 37 nếu IDE yêu cầu, rồi chạy app trên Android Emulator. Khởi động Backend trước. Emulator đã cấu hình gọi API tại `http://10.0.2.2:5059/` (địa chỉ localhost của máy host từ emulator). Nếu chạy trên điện thoại thật, đổi base URL trong `Mobile/app/src/main/java/com/huflit/quanlydoctruyen/data/ApiService.kt` thành địa chỉ LAN của máy đang chạy backend, ví dụ `http://192.168.1.20:5059/`, và bảo đảm firewall cho phép kết nối.

## Chức năng hiện có

- Tìm kiếm truyện theo tên/tác giả, lọc theo thể loại/trạng thái, sắp xếp và phân trang.
- Xem thông tin truyện, danh sách chương và đọc nội dung chương; có cỡ chữ, chế độ tối, chương trước/sau.
- Admin thêm/sửa/xóa truyện, chương và thể loại. Nội dung chương, trạng thái miễn phí và lịch phát hành lưu trong database.
- Android: đăng nhập, khám phá/tìm truyện, xem chi tiết và đọc chương.
