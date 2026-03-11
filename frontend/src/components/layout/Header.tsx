"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const admin = useAppSelector((s) => s.auth.admin);
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    dispatch(logout());
    document.cookie = "adminToken=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search rides, users, drivers..."
          className="bg-transparent outline-none text-sm flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
            {admin?.name?.charAt(0) || "A"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{admin?.name || "Admin"}</p>
            <p className="text-xs text-gray-500 capitalize">{admin?.role?.replace("_", " ") || "Admin"}</p>
          </div>
        </div>

        <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg" title="Logout">
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}
