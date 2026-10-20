# Mobile Android

Ứng dụng Kotlin với Jetpack Compose, Retrofit và Navigation Compose. Mở thư mục này trong Android Studio. Cài Android SDK 37 khi được IDE yêu cầu, chọn emulator và nhấn Run.

Backend phải đang chạy ở cổng 5059. Android Emulator gọi máy phát triển qua `http://10.0.2.2:5059/`, đã đặt trong `app/src/main/java/com/huflit/quanlydoctruyen/data/ApiService.kt`. Nếu dùng điện thoại thật, đổi URL thành địa chỉ LAN của máy chạy backend và cho phép kết nối qua firewall.

App hỗ trợ đăng nhập, tìm/khám phá truyện, xem chi tiết và đọc chương. API sử dụng chung database với giao diện web.
