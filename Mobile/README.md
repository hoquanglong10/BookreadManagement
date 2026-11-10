# Mobile Android

Ứng dụng Kotlin với Jetpack Compose, Retrofit và Navigation Compose. Mở thư mục này trong Android Studio. Cài Android SDK 37 khi được IDE yêu cầu, chọn emulator và nhấn Run.

Backend phải đang chạy ở cổng 5059. Ứng dụng hiện gọi `http://127.0.0.1:5059/`; với Android Emulator hoặc điện thoại Android đang kết nối ADB qua Wi-Fi, chuyển tiếp cổng từ thiết bị tới máy phát triển bằng:

```powershell
adb reverse tcp:5059 tcp:5059
```

Nếu nhiều thiết bị đang kết nối, chỉ rõ serial bằng `adb -s <device-serial> reverse tcp:5059 tcp:5059`. Cách này không cần sửa URL trong ứng dụng. Ngoài ra, có thể cấu hình địa chỉ LAN của máy backend, mở cổng 5059 trong firewall và dùng địa chỉ đó làm `BASE_URL`.

App hỗ trợ đăng ký/đăng nhập, tìm kiếm và lọc truyện, danh sách cập nhật/mới/đọc nhiều, chi tiết/quyền chương, đọc chương và hồ sơ độc giả. API sử dụng chung database với giao diện web.

## Đọc offline

Room lưu tối đa 100 tập gần nhất mà tài khoản đã mở thành công. Cache được phân vùng theo tài khoản hiện đăng nhập; khi không có mạng, trình đọc mở nội dung đã lưu và xếp tiến độ vào hàng đợi cục bộ. Hàng đợi gửi lại khi kết nối trở lại; API khử trùng lặp bằng mã sự kiện để retry an toàn. Tập trả phí chỉ được đưa vào cache sau khi API xác nhận quyền đọc.

Trước lần chạy đầu với phiên bản này, áp dụng migration từ thư mục `Backend`:

```powershell
dotnet ef database update
```

Script kiểm tra tích hợp các API Sprint 5 được mô tả trong [API Reference](../Docs/API-Reference-Sprint5.md).
