"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/store/useStore";
import { setCookie } from "@/lib/utils";
import type { User } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(100),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm"],
});

type FormData = z.infer<typeof schema>;

const FEATURES = [
  "Jusqu'à 1 instance WhatsApp gratuite",
  "Accès API avec webhooks",
  "Suivi des messages en temps réel",
  "Évoluez à tout moment vers plus d'instances",
];

export default function RegisterPage() {
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
      const res = await authApi.register(data.email, data.name, data.password);
      const { token, user } = res.data;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      setCookie("auth_token", token, 7);

      setUser(user as User);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        "Échec de l'inscription. Veuillez réessayer.";
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
            E
          </div>
          <span className="text-white font-semibold text-[15px]">
            EcomCookpit
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Commencez gratuitement dès aujourd'hui
          </h2>
          <p className="text-[13px] text-[#5a7a5a] mb-6">
            Tout ce dont vous avez besoin pour construire une automatisation WhatsApp puissante.
          </p>
          <ul className="space-y-3">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#22c55e] shrink-0" />
                <span className="text-[13px] text-[#8a9a8a]">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ background: "#0d2510", border: "1px solid #1a3a1a" }}
        >
          <p className="text-[12px] text-[#22c55e] font-semibold mb-1">
            Le plan gratuit inclut
          </p>
          <p className="text-[12px] text-[#5a7a5a]">
            1 instance · 1 000 messages/mois · Accès complet à l'API
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              E
            </div>
            <span className="text-white font-semibold">EcomCookpit</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">
            Créer votre compte
          </h1>
          <p className="text-[13px] text-[#5a7a5a] mb-7">
            Gratuit pour toujours · Aucune carte bancaire requise
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
                Nom complet
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Koumen Morgan"
                autoComplete="name"
                autoFocus
                className="input-dark w-full"
              />
              {errors.name && (
                <p className="mt-1 text-[11px] text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">
                Adresse email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="nom@exemple.com"
                autoComplete="email"
                className="input-dark w-full"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="Au moins 6 caractères"
                  autoComplete="new-password"
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

            <div>
              <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                {...register("confirm")}
                type={showPass ? "text" : "password"}
                placeholder="Répétez le mot de passe"
                autoComplete="new-password"
                className="input-dark w-full"
              />
              {errors.confirm && (
                <p className="mt-1 text-[11px] text-red-400">
                  {errors.confirm.message}
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
                  Création du compte...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>

            <p className="text-center text-[11px] text-[#3a5a3a]">
              En vous inscrivant, vous acceptez nos{" "}
              <span className="text-[#22c55e]">Conditions d'utilisation</span> et notre{" "}
              <span className="text-[#22c55e]">Politique de confidentialité</span>.
            </p>
          </form>

          <p className="text-center text-[13px] text-[#5a7a5a] mt-5">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-[#22c55e] hover:text-[#4ade80] font-medium transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
