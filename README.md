## Bambi Kitchen Web – SWD Project Overview

Bambi Kitchen là chuỗi bán đồ ăn healthy cho phép khách hàng tùy chỉnh món theo từng bước, tích hợp AI phân tích dinh dưỡng và gợi ý cho các lần đặt sau. Ứng dụng web phục vụ người dùng đặt món, nhân viên xử lý đơn và admin quản trị doanh thu, menu, nguyên liệu.

### Bối cảnh
- Nhu cầu đặt món healthy nhanh, cá nhân hóa, cân bằng dinh dưỡng/calories.
- Quy trình chọn món truyền thống phức tạp, khó theo dõi calo và thành phần.

### Vấn đề
- Mất thời gian lựa chọn món phù hợp sức khỏe.
- Khó cân bằng dinh dưỡng và calories.
- Thiếu cá nhân hóa, nhiều lựa chọn rời rạc (cơm/protein/rau/canh/tráng miệng).

### Giải pháp
- Gợi ý đặt món theo từng bước có tích hợp AI; AI đánh giá món và gợi ý cho lần đặt sau.
- Tự động tính calories theo thành phần; lưu món để order nhanh.
- Workflow trực quan: Cơm → Protein → Rau củ → Canh (optional) → Tráng miệng (optional).

### Tác nhân
- Customer, Staff, Admin, AI system.

### Tính năng chính
1) User
   - Đặt món theo từng bước (kéo/thả thành phần, xem ảnh minh họa, giá và calo thời gian thực).
   - Áp mã, thanh toán COD/online; đánh giá sau khi hoàn tất đơn.
   - Lịch sử và Order nhanh (reorder không cần chọn lại thành phần).

2) Staff
   - Nhận thông báo đơn mới, nhận đơn để tránh trùng lặp.
   - Trực quan hóa nguyên liệu theo sơ đồ quầy, highlight nguyên liệu của đơn đang chọn.
   - Xác nhận thanh toán COD; quản lý tồn kho chủ động/tự động, cảnh báo khi < 5 phần.

3) Admin
   - Dashboard doanh thu trực quan; quản lý menu, đơn hàng, thành phần, nguyên liệu, feedback.

4) AI
   - Phân tích món ăn và đưa nhận xét/gợi ý dinh dưỡng.

### Functional Requirements (rút gọn)
- FR-01 → FR-07: Đăng ký/đăng nhập; đặt món theo bước; xem chi tiết trước khi xác nhận; áp mã & thanh toán; tính calories thời gian thực; order nhanh; đánh giá.
- FR-08 → FR-14: Staff nhận đơn, trực quan hóa nguyên liệu, cập nhật trạng thái, xác nhận COD, quản lý tồn kho, tự động trừ nguyên liệu.
- FR-15 → FR-17: Admin dashboard và quản trị; AI phân tích/nhận xét dinh dưỡng.

### Non-functional Requirements
- ≥ 700 concurrent users; realtime sync; UI trực quan kéo/thả; bảo mật; kiến trúc module; phản hồi ≤ 2s; uptime ≥ 99.9%.

### Business Rules (tiêu biểu)
- Mỗi SĐT/Email duy nhất; OTP khi đổi mật khẩu; ẩn nguyên liệu hết; phải có ít nhất 1 protein; chuẩn hóa định lượng; tính calo & hiển thị trước xác nhận; tự hủy đơn chưa thanh toán sau 5 phút; lưu lịch sử để reorder; cảnh báo tồn kho; dấu thời gian cho thanh toán online.

### Tech & Run
- FE: React + TypeScript + Vite, Zustand, Tailwind.
- API: OpenAPI v3 (bambi.kdz.asia).

Phát triển
- Cài đặt: `npm i`
- Chạy dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

