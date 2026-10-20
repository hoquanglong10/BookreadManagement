# Frontend Web

Giao diện web HTML/CSS/JavaScript thuần, được Backend phục vụ tại `http://localhost:5059/app/`. Không cần Node/npm để chạy production/dev cùng backend.

## Cấu trúc

- `index.html`, `story.html`, `reader.html`, `account.html`: khám phá, chi tiết, đọc truyện, đăng nhập.
- `admin.html`, `admin-stories.html`, `admin-genres.html`: quản trị khách hàng, truyện/chương, thể loại.
- `js/api/`: client dùng chung và endpoint theo tài nguyên.
- `js/core/`: phiên đăng nhập và xử lý quyền.
- `js/pages/`: luồng chức năng và sự kiện từng trang.
- `js/ui/`: dựng/cập nhật giao diện và thông báo.
- `styles/`: style nền và style riêng cho trang.

## Chạy và chức năng

Chạy Backend theo [hướng dẫn](../../Backend/README.md), áp dụng migration bằng `dotnet ef database update`, sau đó mở `http://localhost:5059/app/`.

Trang chủ hỗ trợ tìm kiếm, lọc thể loại/trạng thái, sắp xếp và phân trang. Trang chi tiết có mục lục; trang đọc có chế độ tối, cỡ chữ, điều hướng chương trước/sau. Admin có thể cập nhật nội dung chương, lịch phát hành, và danh sách thể loại. Các trang gọi API cùng origin; API base URL tập trung trong `js/api/client.js`.
