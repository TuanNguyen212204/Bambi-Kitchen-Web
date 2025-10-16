# Bambi Kitchen Web – Ghi chú cấu hình Firebase

## Thiết lập biến môi trường (Vite)

Tạo file `.env` ở thư mục gốc với các biến sau (Vite chỉ đọc biến bắt đầu bằng `VITE_`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...  # ví dụ: your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## Cấu trúc module Firebase

- `src/config/firebase.ts`: khởi tạo `app` và export `storage` từ Firebase v9 modular.
- Không commit khóa bí mật vào repo; luôn dùng biến môi trường.

## Upload file từ FE

- Sử dụng `src/utils/file.js` với hàm `uploadFile(file, { folder, metadata, fileName })`.
- Mặc định lưu vào thư mục `uploads/` và sinh tên file unique theo timestamp + random.

