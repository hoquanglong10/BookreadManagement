# SRS — Yêu cầu chức năng

## Quy ước

Các FR01–FR18 giữ nguyên mã trong phần Project Information của Product Backlog. FR19 trở đi bổ sung yêu cầu nền tảng quan sát được trong repository. Mỗi yêu cầu mô tả hành vi đích; cột trạng thái cho biết mức triển khai hiện tại.

| Trạng thái | Ý nghĩa |
|---|---|
| Đã có | Có luồng tương ứng trong mã nguồn hiện tại. |
| Một phần | Có một phần chức năng, còn thiếu tiêu chí hoặc nền tảng. |
| Chưa triển khai | Chưa thấy chức năng tương ứng trong mã nguồn. |

## 1. Tài khoản và phân quyền

### FR19 — Đăng ký, đăng nhập và phiên xác thực

- Hệ thống phải cho phép người chưa đăng nhập đăng ký bằng username, email và password.
- Username phải dài 3–30 ký tự, chỉ gồm chữ cái Latin, số, dấu gạch dưới, dấu chấm hoặc gạch nối. Email hợp lệ và tối đa 256 ký tự. Password dài 8–128 ký tự.
- Hệ thống phải từ chối username/email đã sử dụng, lưu password dưới dạng hash và cấp JWT khi đăng nhập thành công.
- Đăng nhập phải nhận username hoặc email cùng password; tài khoản bị khóa không được xác thực.
- Endpoint tài khoản hiện tại phải trả thông tin tài khoản từ JWT hợp lệ. Web và Android phải xóa phiên phía client khi đăng xuất hoặc khi token hết hạn.
- **Trạng thái:** Đã có luồng cơ bản trên API, Web và Android. Đổi mật khẩu, cập nhật hồ sơ và ảnh đại diện chưa có.

### FR20 — Vai trò và phân quyền

- Khách được gọi endpoint công khai.
- Thành viên được dùng chức năng yêu cầu đăng nhập khi các chức năng đó được xây dựng.
- Chỉ Admin được tạo, sửa hoặc xóa nội dung quản trị và dữ liệu quản trị.
- **Trạng thái:** Đã có role User/Admin, JWT Bearer và bảo vệ API quản trị. Chưa có ma trận quyền riêng cho các tính năng thành viên trong backlog.

## 2. Quản lý nội dung

### FR01 — Quản lý thông tin truyện

- Admin phải tạo, cập nhật và xóa truyện.
- Thông tin tối thiểu gồm tên, tác giả, giới thiệu, trạng thái phát hành, thể loại và cách trình bày bìa.
- Mục tiêu backlog yêu cầu một truyện có thể có nhiều thể loại và tải ảnh bìa.
- **Trạng thái:** Một phần. CRUD truyện, metadata, status và cover theme đã có; hiện lưu một tên thể loại trên Story, chưa có upload ảnh bìa hoặc quan hệ nhiều-nhiều.

### FR02 — Quản lý chương

- Admin phải tạo, sửa và xóa chương thuộc một truyện; mỗi chương có số thứ tự duy nhất trong truyện, tên, nội dung, cờ miễn phí và thời điểm phát hành.
- Chương chưa đến thời điểm phát hành không được đọc bởi khách/thành viên.
- **Trạng thái:** Một phần đến đã có. CRUD nội dung, số thứ tự duy nhất, cờ IsFree và thời điểm phát hành đã có. Endpoint đọc chương chặn chương chưa phát hành; endpoint mục lục hiện vẫn trả metadata chương chưa phát hành kèm cờ trạng thái.

### FR21 — Quản lý thể loại

- Admin phải xem, thêm, đổi tên và xóa thể loại.
- Không được xóa thể loại đang được truyện sử dụng. Đổi tên phải cập nhật các truyện liên quan.
- **Trạng thái:** Đã có trong API và trang quản trị Web.

## 3. Khám phá và đọc

### FR04 — Tra cứu và duyệt truyện

- Người dùng phải tìm truyện theo tên hoặc tác giả, lọc theo thể loại/trạng thái và phân trang kết quả.
- Hệ thống phải hỗ trợ danh sách theo mới cập nhật, mới phát hành và lượt đọc cao.
- **Trạng thái:** Một phần đến đã có. API hỗ trợ tìm kiếm tên/tác giả, lọc thể loại/trạng thái, sắp xếp updated/newest/views và phân trang. Ba khu vực danh sách riêng như backlog yêu cầu chưa được xác nhận có đầy đủ trên giao diện.

### FR05 — Xem thông tin và đọc chương

- Người dùng phải xem chi tiết truyện và danh sách chương theo thứ tự.
- Người dùng chỉ được đọc chương đã phát hành, có nội dung và họ có quyền truy cập theo FR09.
- Trình đọc phải có điều hướng chương trước/sau, cỡ chữ và chế độ sáng/tối.
- **Trạng thái:** Một phần. Trang chi tiết, mục lục, nội dung, điều hướng và cài đặt đọc đã có. Backend hiện chưa thực thi quyền trả phí theo FR09; cờ IsFree chưa được dùng để chặn đọc. Mục lục công khai hiện có thể lộ metadata của chương chưa phát hành.

### FR18 — Ghi nhận hoạt động nội dung

- Hệ thống phải ghi nhận lượt đọc ở cấp truyện/chương và hỗ trợ thống kê nội dung theo khoảng thời gian, lượt theo dõi, mua và mức quan tâm thể loại.
- **Trạng thái:** Một phần. Mỗi lần đọc chương hiện tăng ViewCount; API có thể sắp xếp theo tổng lượt xem. Chưa có lịch sử sự kiện đọc theo thời gian, theo dõi, mua hoặc dashboard thống kê.

## 4. Chính sách trả phí và giao dịch

### FR03 — Thiết lập chính sách truy cập

- Admin phải thiết lập nội dung miễn phí, trả phí hoặc kết hợp; xác định chương miễn phí và giá mua truyện.
- **Trạng thái:** Một phần. Admin có thể đặt cờ IsFree trên chương. Chưa có loại truyện, giá, cấu hình số chương miễn phí hay cơ chế thực thi quyền.

### FR06 — Quản lý gói đọc

- Admin phải tạo, sửa, định giá, thiết lập thời hạn/phạm vi và ngừng cung cấp gói.
- Ngừng bán gói không được làm mất quyền của thuê bao còn hiệu lực.
- **Trạng thái:** Chưa triển khai.

### FR07 — Đăng ký và gia hạn gói

- Thành viên phải có thể đăng ký hoặc gia hạn gói theo tháng bằng cổng thanh toán giả lập.
- Chỉ giao dịch thành công mới kích hoạt hoặc gia hạn quyền. Gia hạn khi gói còn hiệu lực phải cộng thời gian tiếp nối.
- **Trạng thái:** Chưa triển khai.

### FR08 — Mua quyền đọc truyện

- Thành viên phải mua riêng truyện trả phí bằng cổng thanh toán giả lập.
- Quyền mua riêng không hết hạn khi gói đọc hết hạn.
- **Trạng thái:** Chưa triển khai.

### FR09 — Kiểm tra quyền đọc

- Backend phải cho đọc chương khi chương miễn phí, thành viên có gói còn hiệu lực bao gồm nội dung đó, hoặc thành viên đã mua truyện.
- Hệ thống không được yêu cầu thanh toán lần nữa nếu đã có quyền hợp lệ.
- Kiểm tra quyền phải diễn ra tại Backend trước khi trả nội dung chương.
- **Trạng thái:** Chưa triển khai. Hiện API trả nội dung chương đã phát hành cho khách mà không xét IsFree.

### FR10 — Giao dịch và lịch sử thanh toán

- Hệ thống phải ghi giao dịch thành công/thất bại, hiển thị lịch sử cho thành viên và hỗ trợ Admin đối soát trường hợp thanh toán thành công nhưng quyền chưa được cấp.
- Giá sản phẩm phải được lưu tại thời điểm giao dịch. Giao dịch thất bại không cấp quyền.
- **Trạng thái:** Chưa triển khai.

## 5. Cá nhân hóa và cộng đồng

### FR11 — Tiến độ đọc

- Hệ thống phải lưu truyện/chương/vị trí đọc gần nhất theo tài khoản và đồng bộ giữa Web, Android; người dùng có thể tiếp tục đọc và xem danh sách đang đọc.
- **Trạng thái:** Chưa triển khai.

### FR12 — Theo dõi và thông báo

- Thành viên phải theo dõi/bỏ theo dõi truyện và xem danh sách quan tâm.
- Khi truyện được theo dõi phát hành chương mới, hệ thống phải tạo thông báo trong ứng dụng; thành viên có thể đánh dấu đã đọc.
- **Trạng thái:** Chưa triển khai.

### FR13 — Thảo luận theo chương

- Thành viên phải xem, đăng và trả lời thảo luận gắn với đúng chương.
- **Trạng thái:** Chưa triển khai.

### FR14 — Kiểm duyệt thảo luận

- Người dùng phải báo cáo thảo luận vi phạm; Admin phải xem/xử lý báo cáo và ẩn hoặc xóa nội dung.
- **Trạng thái:** Chưa triển khai.

## 6. Quản trị thành viên và báo cáo

### FR15 — Quản lý thành viên

- Admin phải xem/lọc trạng thái tài khoản, xem gói đang dùng và truyện đã mua; có thể hạn chế hoặc khóa tài khoản vi phạm.
- Tài khoản bị khóa không được đăng nhập hoặc tham gia thảo luận.
- **Trạng thái:** Một phần ở mức dữ liệu nền. User có IsLocked và API đăng nhập kiểm tra cờ này, nhưng chưa có API/giao diện quản trị tài khoản User. CRUD Customer hiện thao tác bảng Customer riêng.

### FR16 — Thống kê hoạt động

- Admin phải lọc theo thời gian và xem số thành viên, đăng ký/gia hạn gói, mua truyện và trạng thái giao dịch.
- **Trạng thái:** Chưa triển khai.

### FR17 — Thống kê doanh thu

- Admin phải xem doanh thu theo gói, truyện và khoảng thời gian; hỗ trợ tổng hợp theo ngày/tháng.
- **Trạng thái:** Chưa triển khai.

## 7. Yêu cầu chức năng hỗ trợ hiện có

### FR22 — Quản lý hồ sơ khách hàng nghiệp vụ

- Admin phải xem, thêm, sửa và xóa bản ghi khách hàng gồm họ tên, điện thoại, email và địa chỉ.
- **Trạng thái:** Đã có CRUD API được bảo vệ bằng role Admin. Đây là dữ liệu Customer độc lập, không phải chức năng quản lý tài khoản thành viên FR15.

### FR23 — Kiểm tra trạng thái API

- Hệ thống phải cung cấp endpoint công khai để xác nhận API đang phản hồi.
- **Trạng thái:** Đã có GET /api/health. Endpoint hiện không xác nhận database đang kết nối được.

## 8. Quy tắc nghiệp vụ đích

Các quy tắc này lấy từ Product Backlog và chỉ áp dụng đầy đủ sau khi các tính năng giao dịch/quyền đọc được triển khai.

1. Truyện/chương miễn phí có thể đọc mà không cần thanh toán hoặc gói.
2. Chương trả phí chỉ đọc được khi có quyền từ gói còn hiệu lực hoặc giao dịch mua truyện thành công.
3. Gói hết hạn không thu hồi quyền mua riêng còn hiệu lực.
4. Giao dịch thất bại không cấp quyền; quyền chỉ phát sinh sau khi xác nhận thanh toán thành công.
5. Giá trong giao dịch là giá tại thời điểm mua.
6. Giao dịch thành công nhưng thiếu quyền phải có luồng đối soát và cấp bù có kiểm soát.
7. Bình luận/thảo luận phải liên kết tới chương cụ thể.

## 9. Luồng sử dụng chính

### UC01 — Tìm và mở truyện

1. Khách mở trang khám phá.
2. Hệ thống tải danh sách và thể loại.
3. Khách nhập từ khóa hoặc chọn lọc/sắp xếp.
4. Hệ thống trả kết quả theo điều kiện và trang được chọn.
5. Khách mở truyện để xem mô tả và mục lục.

**Ngoại lệ:** Backend không truy cập được thì giao diện báo lỗi và cho thử lại; danh sách rỗng thì thông báo không có kết quả.

### UC02 — Đọc chương

1. Khách/thành viên chọn chương đã phát hành.
2. Backend kiểm tra truyện/chương tồn tại, thời gian phát hành và quyền đọc.
3. Nếu chương có nội dung và được phép đọc, Backend trả nội dung và số chương trước/sau.
4. Backend tăng số lượt đọc; giao diện hiển thị nội dung và điều khiển đọc.

**Ngoại lệ:** Chương không tồn tại/chưa phát hành trả lỗi phù hợp; chương rỗng báo cần Admin bổ sung; chương trả phí không có quyền phải bị từ chối (yêu cầu đích, chưa có trong phiên bản hiện tại).

### UC03 — Đăng ký và đăng nhập

1. Người dùng gửi thông tin đăng ký hoặc thông tin đăng nhập.
2. Backend xác thực dữ liệu, kiểm tra trùng tài khoản và kiểm tra mật khẩu.
3. Khi đăng nhập thành công, Backend phát JWT cùng thông tin người dùng và hạn token.
4. Client lưu phiên; client gửi JWT trong Authorization Bearer khi gọi API cần xác thực.
5. Khi đăng xuất/hết hạn, client xóa phiên.

### UC04 — Admin cập nhật truyện/chương

1. Admin đăng nhập và mở trang quản trị.
2. Client gửi yêu cầu CRUD kèm JWT.
3. Backend kiểm tra token, role, dữ liệu bắt buộc, giới hạn và quy tắc duy nhất.
4. Backend lưu thay đổi và trả kết quả; lỗi xác thực/trùng dữ liệu được báo cho Admin.

### UC05 — Admin quản lý thể loại

1. Admin xem danh sách thể loại.
2. Admin thêm, đổi tên hoặc xóa thể loại.
3. Backend từ chối tên trùng; từ chối xóa thể loại còn được truyện sử dụng; đổi tên đồng thời cập nhật các truyện liên quan.

## 10. Hợp đồng với Product Backlog

Product Backlog có 42 story PB01–PB42. Trạng thái theo từng story và lý do được duy trì trong [SRS-Traceability.md](SRS-Traceability.md). Khi phạm vi được đổi, cập nhật đồng thời backlog, tài liệu này và ma trận truy vết.
