# SRS — Ma trận truy vết Product Backlog

Trạng thái dưới đây được rà soát ngày 2026-11-10. Web production build, Backend build, Android debug build và test hợp đồng Android đều thành công. Sau khi áp dụng migration Sprint 5 trên database phát triển, `GET /api/stories/1/chapters/1` trả HTTP 200. Script API integration đã được thêm nhưng chưa chạy vì phiên kiểm tra không có thông tin tài khoản Admin.

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
| PB26 | Tiến độ đọc đồng bộ | Đã triển khai | Lượt đọc tập đã đăng nhập được lưu trong ReadEvents; API trả tập đã đọc, tập gần nhất; Web và Android đồng bộ để tiếp tục trên thiết bị khác. |
| PB27 | Danh sách truyện đang đọc | Đã triển khai | Web có trang lịch sử/tiếp tục đọc; Mobile có kệ Đọc tiếp; API trả tiến độ gần nhất theo từng truyện. |
| PB28 | Theo dõi truyện | Đã triển khai | Thành viên theo dõi/bỏ theo dõi ở trang truyện, xem danh sách trên Web và Mobile; ràng buộc duy nhất theo tài khoản/truyện. |
| PB29 | Thông báo chương mới | Đã triển khai | API tạo thông báo khi thành viên tải danh sách thông báo; Web/Mobile xem thông báo và đánh dấu từng mục hoặc tất cả đã đọc. |
| PB30 | Thảo luận theo chương | Đã triển khai | Bình luận và trả lời một cấp gắn với Chương truyện (không tách theo Tập); hiển thị tại trang đọc Web/Mobile. |
| PB31 | Báo cáo vi phạm | Đã triển khai | Thành viên gửi lý do báo cáo bình luận, không thể tự báo cáo hoặc gửi trùng báo cáo đang chờ cho cùng nội dung. |
| PB32 | Kiểm duyệt thảo luận | Đã triển khai | Admin lọc báo cáo/bình luận, ẩn/hiện/gỡ bình luận, xử lý hoặc bỏ qua báo cáo; lưu người xử lý và thời điểm. |
| PB33 | Quản lý tài khoản/thông tin dịch vụ | Đã triển khai | Trang/API Admin tìm và lọc User, xem gói còn hiệu lực và truyện đã mua; dữ liệu Customer cũ vẫn độc lập. |
| PB34 | Khóa tài khoản thành viên | Đã triển khai | Admin khóa/mở User; đăng nhập và JWT đang hoạt động bị từ chối ngay khi tài khoản bị khóa, không thể đăng bình luận. |
| PB35 | Thống kê hoạt động thành viên/giao dịch | Đã triển khai | API Admin có khoảng ngày, đăng ký tài khoản, đăng ký/gia hạn gói, mua truyện, gói còn hạn và trạng thái giao dịch; Web có trang Thống kê. |
| PB36 | Thống kê doanh thu | Đã triển khai | API/Admin hiển thị doanh thu giao dịch Success theo ngày/tháng, gói và truyện; Web có biểu đồ và phân rã nguồn thu. |
| PB37 | Thống kê nội dung | Đã triển khai | Báo cáo theo kỳ có truyện được đọc/theo dõi/mua và thể loại được theo dõi nhiều; Web hiển thị xếp hạng. |
| PB38 | CSDL, migration EF Core/SQL Server | Đã áp dụng | ApplicationDbContext và toàn bộ EF Core migrations đã áp dụng lên SQL Server local ngày 2026-10-27. |
| PB39 | Khung API, Swagger, lỗi, CORS | Một phần | Swagger, CORS, validation cơ bản đã có; định dạng lỗi chưa thống nhất hoàn toàn. |
| PB40 | Khung Web/Mobile cùng API | Đã triển khai | React/Vite và Android Compose/Retrofit cùng gọi API; Room lưu bản đọc offline và hàng đợi tiến độ. |
| PB41 | Đọc offline trên Android | Đã triển khai | Room lưu 100 tập gần nhất theo tài khoản, trình đọc dùng bản cache khi mất mạng và đồng bộ hàng đợi khi có mạng; build và test Android đã chạy qua. Migration đã áp dụng trên database phát triển ngày 2026-11-10; endpoint đọc xác nhận trả HTTP 200. |
| PB42 | Kiểm thử tích hợp và tài liệu API | Một phần | Có script PowerShell kiểm tra ba API báo cáo và endpoint đồng bộ, test hợp đồng offline trên Android, Swagger/README/API reference. Chưa chạy script API với tài khoản Admin trong phiên kiểm tra. |

## Sai khác phạm vi và kiểm thử

1. Backlog mô tả .NET 10, React + TypeScript + Tailwind và Room; repository hiện vẫn dùng .NET 8, React/Vite JavaScript và Android Retrofit.
2. Thanh toán là mô phỏng và chưa nối cổng tiền thật; không dùng cho giao dịch thực tế.
3. Dashboard doanh thu chỉ tính giao dịch `Success`; phân loại gia hạn suy ra từ giao dịch thành công trước đó cùng gói và thành viên vì schema không lưu loại đăng ký/gia hạn riêng.
4. Migration `Sprint5OfflineReadProgress` đã được áp dụng trên database phát triển ngày 2026-11-10. Kiểm thử API đồng bộ offline với tài khoản Admin vẫn chưa chạy trong phiên này.
## Cập nhật ma trận

Khi triển khai hoặc đổi yêu cầu, cập nhật trạng thái và căn cứ trong bảng này cùng yêu cầu tương ứng ở [SRS-Functional-Requirements.md](SRS-Functional-Requirements.md). Hướng dẫn API và kiểm tra Sprint 5 nằm trong [API-Reference-Sprint5.md](API-Reference-Sprint5.md) và [tests](tests/Sprint5-ApiIntegration.Tests.ps1).
