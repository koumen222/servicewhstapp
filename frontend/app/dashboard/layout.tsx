"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAppStore } from "@/store/useStore";
import { instancesApi } from "@/lib/api";

// NoSSR component to prevent hydration mismatch
function NoSSR({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  if (!isClient) return null;
  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser, setInstances, isLoadingInstances, setLoadingInstances, instancesLoaded, setInstancesLoaded } = useAppStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    // Re-hydrate user from localStorage if store is empty
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!user) {
      const savedUser = localStorage.getItem("auth_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (_) {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    }

    // Guard: ne charger les instances qu'une seule fois (évite les doubles appels API)
    if (instancesLoaded || isLoadingInstances) return;

    setLoadingInstances(true);
    instancesApi.getAll()
      .then(res => {
        const data = res.data?.data?.instances ?? [];
        setInstances(data);
        setInstancesLoaded(true);
      })
      .catch(() => {
        setInstances([]);
        setInstancesLoaded(true);
      })
      .finally(() => setLoadingInstances(false));
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-black text-sm"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            W
          </div>
          <div className="w-5 h-5 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <NoSSR>
          <AnimatePresence>
            <motion.div
              key="mobile-sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
            >
              <div
                className="absolute inset-0"
                style={{ background: "rgba(0,0,0,0.6)" }}
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute left-0 top-0 bottom-0"
              >
                <Sidebar mobile onClose={() => setMobileSidebarOpen(false)} />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </NoSSR>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
