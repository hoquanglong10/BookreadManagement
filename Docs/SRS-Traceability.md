# SRS — Ma trận truy vết Product Backlog

Trạng thái dưới đây được suy ra từ việc đọc mã nguồn trong repository. Chưa chạy kiểm thử tích hợp hoặc kiểm thử chấp nhận trong quá trình lập bảng.

| Story | Yêu cầu | Trạng thái | Căn cứ / phần còn thiếu |
|---|---|---|---|
| PB01 | Đăng ký tài khoản thành viên | Đã có | API register, kiểm tra username/email, BCrypt; Web và Android có màn hình đăng ký. |
| PB02 | Đăng nhập/đăng xuất JWT | Đã có | API phát JWT; Web/Android giữ và xóa phiên. |
| PB03 | Phân quyền Khách/Thành viên/Admin | Một phần | Khách và Admin được xử lý; role người đăng ký là User. Chưa có toàn bộ tính năng dành riêng cho thành viên. |
| PB04 | Hồ sơ, đổi mật khẩu | Chưa triển khai | Có GET /auth/me; chưa có cập nhật hồ sơ, đổi mật khẩu hoặc avatar. |
| PB05 | Quản lý thể loại | Đã có | GET công khai; Admin CRUD; chặn xóa thể loại đang dùng và cập nhật truyện khi đổi tên. |
| PB06 | Truyện, ảnh bìa, nhiều thể loại | Một phần | CRUD truyện có; chưa upload ảnh bìa, hiện chỉ một chuỗi thể loại. |
| PB07 | Trạng thái phát hành truyện | Đã có | Story có trạng thái đang cập nhật/hoàn thành; API kiểm tra giá trị. |
| PB08 | Tạo/tải lên chương | Một phần | Tạo chương và nội dung dạng text đã có; chưa thấy upload tệp chương. |
| PB09 | Sửa và xóa chương | Đã có | API Admin sửa/xóa theo storyId và chapterId. |
| PB10 | Hẹn giờ phát hành | Một phần | PublishAt được lưu; đọc chương chưa phát hành bị chặn. Endpoint mục lục công khai vẫn trả metadata chưa phát hành. |
| PB11 | Tìm truyện tên/tác giả/thể loại | Đã có | API hỗ trợ search/keyword, genreId, phân trang; mỗi truyện hiện chỉ gắn một thể loại. |
| PB12 | Danh sách cập nhật/mới/đọc nhiều | Một phần | API có sort updated/newest/views; yêu cầu ba danh sách độc lập trên trang chủ chưa được đáp ứng rõ. |
| PB13 | Chi tiết và nhãn quyền truy cập | Một phần | Chi tiết/mục lục có; AccessType hiện trả Free và chưa có trạng thái đã mở khóa/quyền trả phí đúng nghiệp vụ. |
| PB14 | Đọc chương và điều khiển | Đã có | Web và Android có điều hướng chương, chỉnh cỡ chữ, sáng/tối; cần kiểm thử nghiệm thu hai nền tảng. |
| PB15 | Ghi nhận lượt đọc | Một phần | ViewCount tăng khi đọc; chưa ghi sự kiện và thời điểm phục vụ thống kê theo khoảng thời gian. |
| PB16 | Chính sách miễn phí/trả phí | Một phần | Có IsFree ở cấp chương; chưa có loại truyện, giá và kiểm tra quyền. |
| PB17 | Giá mua truyện | Chưa triển khai | Không có trường giá lưu trong Story; response hiện có Price=0 cố định. |
| PB18 | Quản lý gói đọc | Chưa triển khai | Chưa có entity/API quản lý gói. |
| PB19 | Đăng ký gói và thanh toán giả lập | Chưa triển khai | Không thấy luồng thanh toán. |
| PB20 | Gia hạn gói | Chưa triển khai | Không có subscription hoặc ngày hết hạn. |
| PB21 | Mua riêng truyện | Chưa triển khai | Không có giao dịch/quyền mua. |
| PB22 | Kiểm tra quyền chương trả phí | Chưa triển khai | Endpoint đọc chưa kiểm tra IsFree hay quyền người dùng. |
| PB23 | Giao dịch thất bại | Chưa triển khai | Không có entity hoặc trạng thái giao dịch. |
| PB24 | Đối soát và cấp quyền bù | Chưa triển khai | Chưa có công cụ đối soát. |
| PB25 | Lịch sử thanh toán/gói/truyện mua | Chưa triển khai | Chưa có dữ liệu giao dịch hoặc giao diện lịch sử. |
| PB26 | Tiến độ đọc đồng bộ | Chưa triển khai | Chưa có entity/API lưu vị trí đọc. |
| PB27 | Danh sách truyện đang đọc | Chưa triển khai | Chưa có tiến độ đọc để tổng hợp. |
| PB28 | Theo dõi truyện | Chưa triển khai | Chưa có quan hệ theo dõi. |
| PB29 | Thông báo chương mới | Chưa triển khai | Chưa có thông báo. |
| PB30 | Thảo luận theo chương | Chưa triển khai | Chưa có bình luận/thảo luận. |
| PB31 | Báo cáo vi phạm | Chưa triển khai | Chưa có báo cáo nội dung. |
| PB32 | Kiểm duyệt thảo luận | Chưa triển khai | Chưa có công cụ kiểm duyệt. |
| PB33 | Quản lý tài khoản/thông tin dịch vụ | Một phần | Có CRUD Customer độc lập; chưa có trang/API quản lý User cùng gói/truyện đã mua. |
| PB34 | Khóa tài khoản thành viên | Một phần | User.IsLocked được kiểm tra khi đăng nhập; chưa có API/UI Admin để khóa/mở tài khoản User. |
| PB35 | Thống kê hoạt động thành viên/giao dịch | Chưa triển khai | Chưa có gói/giao dịch hoặc dashboard thống kê. |
| PB36 | Thống kê doanh thu | Chưa triển khai | Chưa có dữ liệu doanh thu. |
| PB37 | Thống kê nội dung | Một phần | Có ViewCount và sort theo lượt đọc; chưa có thống kê theo thời gian, theo dõi, mua hoặc thể loại quan tâm. |
| PB38 | CSDL, migration EF Core/SQL Server | Đã có | ApplicationDbContext và các EF Core migrations hiện diện. |
| PB39 | Khung API, Swagger, lỗi, CORS | Một phần | Swagger, CORS, validation cơ bản đã có; định dạng lỗi chưa thống nhất hoàn toàn. |
| PB40 | Khung Web/Mobile cùng API | Một phần | Web thuần và Android Compose/Retrofit cùng gọi API; backlog mô tả React/Vite và Room nhưng repository khác, URL Android cũng cần thống nhất. |
| PB41 | Đọc offline trên Android | Chưa triển khai | Chưa thấy lưu chương Room/cache offline và đồng bộ. |
| PB42 | Kiểm thử tích hợp và tài liệu API | Một phần | Có Swagger/README; không thấy bộ kiểm thử tích hợp Backend-Web-Mobile trong repository. |

## Sai khác phạm vi và công nghệ cần xác nhận

1. Project Information trong Excel ghi Backend .NET 10, Web React + TypeScript + Vite + Tailwind, Mobile có Room. Repository hiện dùng .NET 8, Web HTML/CSS/JavaScript thuần, Android Retrofit; chưa thấy Room được dùng cho đọc offline.
2. Product Backlog bao gồm quyền truy cập trả phí, gói, thanh toán, theo dõi, thảo luận và thống kê; các nhóm này chưa hiện diện trong schema/API hiện tại.
3. Story hiện lưu một chuỗi tên thể loại và chưa có ảnh bìa tải lên; backlog yêu cầu nhiều thể loại và ảnh bìa.
4. Mô hình Customer hiện có CRUD, nhưng không liên kết User; không nên tính CRUD Customer là hoàn thành quản trị thành viên.
5. README Mobile chỉ dẫn URL emulator 10.0.2.2, còn code đặt 127.0.0.1. Cần quyết định cách chạy chính thức (emulator, adb reverse hay LAN) và cập nhật một nguồn cấu hình.

## Cập nhật ma trận

Khi triển khai hoặc đổi yêu cầu, cập nhật trạng thái và căn cứ trong bảng này cùng yêu cầu tương ứng ở [SRS-Functional-Requirements.md](SRS-Functional-Requirements.md). Trước khi phát hành, cần xác minh mỗi mục “Đã có” bằng kiểm thử chấp nhận trên API và các client liên quan.
