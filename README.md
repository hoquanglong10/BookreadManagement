Hello

Mở `http://localhost:5059/swagger` trong môi trường Development. Lần chạy đầu sẽ tạo tài khoản `admin` nếu chưa tồn tại; mật khẩu là giá trị `SeedAdmin:Password` đã cấu hình và chỉ được lưu dưới dạng BCrypt hash.

Đăng nhập tại `POST /api/auth/login`. Sao chép giá trị `token` và nhập **chỉ token** vào nút Authorize của Swagger; Swagger tự thêm tiền tố `Bearer`.

Các API Customer yêu cầu JWT: `GET /api/customers`, `GET /api/customers/{id}`, `POST /api/customers`, `PUT /api/customers/{id}` và `DELETE /api/customers/{id}`.
