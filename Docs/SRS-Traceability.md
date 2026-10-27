# SRS — Ma trận truy vết Product Backlog

Trạng thái dưới đây được suy ra từ mã nguồn và xác minh môi trường local ngày 2026-10-27. Backend Release, Web production build, Android assembleDebug và migrations đã chạy thành công. Đã smoke test các luồng thanh toán mô phỏng, thất bại, gia hạn, đối soát và lịch sử bằng tài khoản tạm rồi xóa dữ liệu kiểm thử. Chưa có bộ kiểm thử tự động tích hợp trong repository.

| Story | Yêu cầu | Trạng thái | Căn cứ / phần còn thiếu |
|---|---|---|---|
| PB01 | Đăng ký tài khoản thành viên | Đã triển khai | API đăng ký, xác thực username/email, BCrypt; Web và Android có giao diện đăng ký. |
| PB02 | Đăng nhập/đăng xuất JWT | Đã triển khai | API phát JWT; Web/Android lưu phiên và xóa phiên khi đăng xuất hoặc token hết hạn. |
| PB03 | Phân quyền Khách/Thành viên/Admin | Đã triển khai | Khách đọc nội dung miễn phí; tài khoản thành viên dùng phiên JWT; API và route quản trị kiểm tra role Admin. |
| PB04 | Hồ sơ, đổi mật khẩu | Đã triển khai | API cập nhật tên hiển thị/avatar URL và đổi mật khẩu hiện tại; Web và Android có màn hình hồ sơ. |
| PB05 | Quản lý thể loại | Đã triển khai | Admin CRUD; thể loại liên kết được nhiều truyện/gói, chặn xóa khi đang được sử dụng. |
| PB06 | Truyện, ảnh bìa, nhiều thể loại | Đã triển khai | Admin CRUD truyện, nhiều thể loại, tải ảnh bìa JPG/PNG/WebP tối đa 5 MB; file được phục vụ từ uploads. |
| PB07 | Trạng thái phát hành truyện | Đã triển khai | Hỗ trợ Đang cập nhật/Hoàn thành và kiểm tra dữ liệu khi lưu. |
| PB08 | Tạo/tải lên chương | Đã triển khai | Admin tạo Chương rồi thêm nhiều Tập, nhập nội dung hoặc nạp .txt và lên lịch phát hành. |
| PB09 | Sửa và xóa chương | Đã triển khai | Admin sửa/xóa Tập trong Chương; số đọc nội bộ vẫn giữ đường dẫn reader cũ. |
| PB10 | Hẹn giờ phát hành | Đã triển khai | Tập chưa đến giờ không xuất hiện công khai và không đọc được; Admin vẫn xem metadata quản trị. |
| PB11 | Tìm truyện tên/tác giả/thể loại | Đã triển khai | API tìm theo tên/tác giả, lọc thể loại/trạng thái, sắp xếp và phân trang; Web/Android gọi API. |
| PB12 | Danh sách cập nhật/mới/đọc nhiều | Đã triển khai | Trang khám phá Web và Android hiển thị các danh sách riêng, lấy từ sort API. |
| PB13 | Chi tiết và nhãn quyền truy cập | Đã triển khai | Chi tiết, mục lục Chương → Tập, nhãn miễn phí/trả phí/đã mở khóa và trạng thái nội dung. |
| PB14 | Đọc chương và điều khiển | Đã triển khai | Web/Android đọc/chuyển Tập, chỉnh cỡ chữ, chế độ sáng/tối; API kiểm tra quyền trước khi trả nội dung. |
| PB15 | Ghi nhận lượt đọc | Đã triển khai | Mỗi lần mở tập tạo ReadEvent có thời điểm và người đọc nếu đã đăng nhập; Admin lọc thống kê theo ngày và tập. |
| PB16 | Chính sách miễn phí/trả phí | Đã triển khai | Free mở mọi Tập; Paid khóa Tập; Mixed mở toàn bộ Tập thuộc N Chương đầu và các Tập được đánh dấu miễn phí. |
| PB17 | Giá mua truyện | Đã triển khai | Giá truyện lưu trong database, chỉnh tại trang quản lý và trả trong API chi tiết. |
| PB18 | Quản lý gói đọc | Đã triển khai | Admin tạo/cập nhật giá, thời hạn, phạm vi truyện/thể loại và ngừng bán mà không thu hồi gói còn hạn. |
| PB19 | Đăng ký gói và thanh toán giả lập | Đã triển khai | Web/Android đăng ký gói qua API; thành công mới tạo quyền. Giao diện ghi rõ không kết nối tiền thật. |
| PB20 | Gia hạn gói | Đã triển khai | Mua lại cùng gói đang hiệu lực thì thời hạn mới nối tiếp từ EndsAt hiện tại. |
| PB21 | Mua riêng truyện | Đã triển khai | Web/Android mua truyện trả phí; quyền mua được lưu riêng và không mất khi gói hết hạn. |
| PB22 | Kiểm tra quyền chương trả phí | Đã triển khai | API kiểm tra tập miễn phí, gói còn hạn đúng phạm vi hoặc quyền mua trước khi trả nội dung. |
| PB23 | Giao dịch thất bại | Đã triển khai | Giao dịch thất bại được lưu với lý do/trạng thái; không cấp quyền và có thể thử lại bằng yêu cầu mới. |
| PB24 | Đối soát và cấp quyền bù | Đã triển khai | Admin xem giao dịch, ghi chú xác minh và cấp quyền bù; lưu Admin/thời điểm, thao tác lặp không cấp trùng. |
| PB25 | Lịch sử thanh toán/gói/truyện mua | Đã triển khai | Thành viên xem lịch sử riêng trên Web và Android; Admin lọc danh sách giao dịch. |
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
| PB37 | Thống kê nội dung | Một phần | Có lượt đọc tổng và báo cáo lượt đọc theo chương/thời gian; chưa thống kê theo theo dõi, mua hoặc thể loại quan tâm. |
| PB38 | CSDL, migration EF Core/SQL Server | Đã áp dụng | ApplicationDbContext và toàn bộ EF Core migrations đã áp dụng lên SQL Server local ngày 2026-10-27. |
| PB39 | Khung API, Swagger, lỗi, CORS | Một phần | Swagger, CORS, validation cơ bản đã có; định dạng lỗi chưa thống nhất hoàn toàn. |
| PB40 | Khung Web/Mobile cùng API | Một phần | Web React/Vite và Android Compose/Retrofit cùng gọi API; Room chưa được dùng cho đọc offline, URL Android cũng cần thống nhất. |
| PB41 | Đọc offline trên Android | Chưa triển khai | Chưa thấy lưu chương Room/cache offline và đồng bộ. |
| PB42 | Kiểm thử tích hợp và tài liệu API | Một phần | Có Swagger/README và đã smoke test thủ công các luồng giao dịch; chưa có bộ kiểm thử tích hợp tự động. |

## Sai khác phạm vi và kiểm thử

1. Backlog mô tả .NET 10, React + TypeScript + Tailwind và Room; repository hiện vẫn dùng .NET 8, React/Vite JavaScript và Android Retrofit.
2. Thanh toán là mô phỏng và chưa nối cổng tiền thật; không dùng cho giao dịch thực tế.
3. Đã smoke test thành công đăng ký/gia hạn, gia hạn nối thời hạn, thất bại không cấp quyền, từ chối đọc trước đối soát, Admin cấp quyền bù, lịch sử và idempotency. Không có kiểm thử tự động trong repository.
## Cập nhật ma trận

Khi triển khai hoặc đổi yêu cầu, cập nhật trạng thái và căn cứ trong bảng này cùng yêu cầu tương ứng ở [SRS-Functional-Requirements.md](SRS-Functional-Requirements.md). Trước khi phát hành, cần xác minh mỗi mục “Đã có” bằng kiểm thử chấp nhận trên API và các client liên quan.
