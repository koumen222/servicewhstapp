"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAppStore } from "@/store/useStore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!user) {
      const savedUser = localStorage.getItem("auth_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.role !== "admin") {
            router.push("/dashboard");
            return;
          }
          setUser(parsed);
        } catch {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } else if (user.role !== "admin") {
      router.push("/dashboard");
    }
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
