import { useAuthStore } from "@/zustand/stores/auth";

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <h1 className="text-xl font-semibold mb-4">Hồ sơ cá nhân</h1>
        <div className="space-y-2">
          <div><span className="text-gray-500">Tên:</span> {user?.name ?? "-"}</div>
          <div><span className="text-gray-500">Vai trò:</span> {user?.role ?? "-"}</div>
          {user?.email && (
            <div><span className="text-gray-500">Email:</span> {user.email}</div>
          )}
        </div>
      </div>
    </div>
  );
}


