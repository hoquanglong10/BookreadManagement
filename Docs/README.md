# Tài liệu dự án

Thư mục này chứa đặc tả yêu cầu và tài liệu lập kế hoạch của hệ thống quản lý đọc truyện.

## Bộ SRS

- [SRS tổng quan](SRS.md): mục đích, phạm vi, người dùng, môi trường, ràng buộc và yêu cầu chất lượng.
- [Yêu cầu chức năng](SRS-Functional-Requirements.md): đặc tả FR, luồng sử dụng, quy tắc nghiệp vụ và tiêu chí chấp nhận.
- [Dữ liệu và giao diện](SRS-Data-and-Interfaces.md): mô hình dữ liệu hiện tại, API, giao diện giữa Web/Mobile và Backend.
- [Ma trận truy vết](SRS-Traceability.md): đối chiếu PB01–PB42 với chức năng trong mã nguồn hiện tại.

## Tài liệu nguồn

- Product backlog: [ProductBacklog--QuanLyDocTruyen.xlsx](ProductBacklog--QuanLyDocTruyen.xlsx)
- Kế hoạch PERT: [PERT_QuanLyDocTruyen_Nhom3 (1).docx](PERT_QuanLyDocTruyen_Nhom3%20%281%29.docx)
- Ý tưởng giao diện: [../design.md](../design.md)

## Cách đọc trạng thái

Các tài liệu phân biệt mục tiêu của backlog với trạng thái triển khai quan sát được trong repository:

- **Đã có:** có luồng hoặc endpoint tương ứng trong mã nguồn.
- **Một phần:** đã có một phần luồng, nhưng chưa đáp ứng toàn bộ yêu cầu hoặc nền tảng được nêu trong backlog.
- **Chưa triển khai:** chưa thấy chức năng tương ứng trong mã nguồn.
- **Cần xác nhận:** backlog và repository mô tả khác nhau hoặc chưa chốt yêu cầu.

Trạng thái được xác định bằng cách đọc mã nguồn và tài liệu; chưa phải kết quả kiểm thử runtime hay kiểm thử chấp nhận.
