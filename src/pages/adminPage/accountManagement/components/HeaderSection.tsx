import React from "react";

export const HeaderSection: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý tài khoản người dùng, nhân viên và quản trị viên
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Hôm nay: {new Date().toLocaleDateString('vi-VN')}
            </p>
            <p className="text-xs text-gray-400">
              Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
