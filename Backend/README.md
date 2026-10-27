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
- `GET /api/stories/{id}`, `GET /api/stories/{id}/chapters`: chi tiết và mục lục Chương → nhiều Tập; `chapters` dạng phẳng vẫn có để tương thích client cũ.
- `GET /api/stories/{storyId}/chapters/{number}`: nội dung Tập đã phát hành theo số đọc nội bộ cũ; tăng lượt đọc.
- `GET /api/genres`: danh sách thể loại.
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`: tài khoản và xác thực.
- `PUT /api/auth/profile`, `PUT /api/auth/password`: cập nhật tên hiển thị/avatar URL và đổi mật khẩu.
- `GET /api/admin/read-events?from=...&to=...`: Admin xem thống kê lượt đọc theo chương trong khoảng ngày.
- `GET /api/plans/available`: danh sách gói đang mở bán; `/api/plans` (Admin) quản lý gói và phạm vi.
- `POST /api/payments/plans/{id}`, `POST /api/payments/stories/{id}`, `GET /api/payments/mine`: đăng ký/gia hạn, mua truyện và lịch sử giao dịch của thành viên.
- `/api/admin/payments` (Admin): lọc giao dịch và `POST /{id}/reconcile` ghi chú đối soát/cấp quyền bù.
- `/api/customers`, `/api/stories`, `/api/genres` (ghi), và quản lý chương yêu cầu JWT role `Admin`.
- `GET /api/health`: trạng thái API/database.

Các API admin cho phép thêm/sửa/xóa truyện, Chương, Tập và thể loại. Mỗi Tập có số thứ tự trong Chương, nội dung, cờ miễn phí và thời điểm phát hành. Các giao dịch chỉ là mô phỏng, không kết nối ngân hàng/cổng tiền thật.

Trong Development, API nạp bổ sung các tập truyện mẫu nguyên tác và hai gói đọc minh họa theo cách idempotent. Một truyện dùng quyền Mixed và một truyện dùng Paid để có thể thử mua/gia hạn; seeder không tự chạy ở môi trường khác. Chạy `dotnet ef database update` trước khi khởi động lần đầu.

## Migration

Sau khi cập nhật mã nguồn, chạy `dotnet ef database update`. Migration mới tạo giao dịch và bảng Chương; mỗi bản ghi nội dung cũ được giữ nguyên và chuyển thành Tập 1 của một Chương cùng tên. Số đọc nội bộ cũ được bảo toàn để URL reader/API cũ không đổi. Migration không tự áp dụng khi khởi động API.
