"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, Eye, EyeOff, MessageSquare, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/store/useStore";
import { setCookie } from "@/lib/utils";
import type { User } from "@/lib/types";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const res = await authApi.login(data.email, data.password);
      const { token, user } = res.data;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      setCookie("auth_token", token, 7);

      setUser(user as User);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ?? "Login failed. Please try again.";
      setServerError(msg);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] bg-grid-green">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 border-r border-[#141414]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-black text-sm"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 0 20px rgba(34,197,94,0.3)",
            }}
          >
            W
          </div>
          <span className="text-white font-semibold text-[15px]">
            WhatsApp SaaS
          </span>
        </div>

        <div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "#0d2510" }}
          >
            <MessageSquare size={22} className="text-[#22c55e]" />
          </div>
          <blockquote className="text-[22px] font-semibold text-white leading-snug mb-4">
            "The most powerful WhatsApp automation platform for businesses."
          </blockquote>
          <p className="text-[13px] text-[#5a7a5a]">
            Manage multiple WhatsApp instances, automate messaging, and scale
            your customer communications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"].map((c, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold text-black"
                style={{ background: c }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#5a7a5a]">
            Join <span className="text-[#22c55e] font-medium">2,000+</span> businesses
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              W
            </div>
            <span className="text-white font-semibold">WhatsApp SaaS</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-[13px] text-[#5a7a5a] mb-7">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{serverError}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className="input-dark w-full"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#8a9a8a]">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] text-[#22c55e] hover:text-[#4ade80] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-dark w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a6a4a] hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-green w-full h-10 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#5a7a5a] mt-5">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-[#22c55e] hover:text-[#4ade80] font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
