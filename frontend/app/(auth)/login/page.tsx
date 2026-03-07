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
import { useI18n } from "@/lib/i18n";
import type { User } from "@/lib/types";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const { t } = useI18n();
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
        (err as any)?.response?.data?.error ?? t("login.error");
      setServerError(msg);
    }
  }

  return (
    <div className="min-h-screen flex bg-grid-green" style={{ background: 'var(--bg-main)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10" style={{ borderRight: '1px solid var(--table-border)' }}>
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="ZeChat.site" className="w-8 h-8 object-contain" />
          <span className="text-[17px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            ZeChat<span className="text-green-500">.site</span>
          </span>
        </div>

        <div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "var(--green-bg-subtle)" }}
          >
            <MessageSquare size={22} className="text-[#22c55e]" />
          </div>
          <blockquote className="text-[22px] font-semibold leading-snug mb-4" style={{ color: 'var(--text-primary)' }}>
            "{t('login.quote')}"
          </blockquote>
          <p className="text-[13px] text-[#5a7a5a]">
            {t('login.quoteDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"].map((c, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-black"
                style={{ borderColor: 'var(--bg-main)', background: c }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#5a7a5a]">
            {t('login.social')} <span className="text-[#22c55e] font-medium">{t('login.socialCount')}</span> {t('login.socialSuffix')}
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
            <img src="/logo.png" alt="ZeChat.site" className="w-8 h-8 object-contain" />
            <span className="text-[17px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              ZeChat<span className="text-green-500">.site</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('login.title')}</h1>
          <p className="text-[13px] text-[#5a7a5a] mb-7">
            {t('login.subtitle')}
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
                {t('login.email')}
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="moussa.traore@exemple.com"
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
                  {t('login.password')}
                </label>
                <button
                  type="button"
                  className="text-[11px] text-[#22c55e] hover:text-[#4ade80] transition-colors"
                >
                  {t('login.forgotPassword')}
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
                  {t('login.submitting')}
                </>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#5a7a5a] mt-5">
            {t('login.noAccount')}{" "}
            <Link
              href="/register"
              className="text-[#22c55e] hover:text-[#4ade80] font-medium transition-colors"
            >
              {t('login.register')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
