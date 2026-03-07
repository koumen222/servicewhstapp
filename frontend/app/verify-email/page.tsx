"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant");
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Email vérifié avec succès !");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Échec de la vérification");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("Une erreur s'est produite lors de la vérification");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-grid-green p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            {status === "loading" && (
              <div className="w-16 h-16 mx-auto rounded-full bg-zinc-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center"
              >
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </motion.div>
            )}
            {status === "error" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center"
              >
                <XCircle className="h-8 w-8 text-red-500" />
              </motion.div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">
            {status === "loading" && "Vérification en cours..."}
            {status === "success" && "Email vérifié !"}
            {status === "error" && "Échec de la vérification"}
          </h1>

          {/* Message */}
          <p className="text-sm text-zinc-400 mb-6">
            {status === "loading" && "Veuillez patienter pendant que nous vérifions votre email."}
            {status === "success" && message}
            {status === "error" && message}
          </p>

          {/* Actions */}
          {status === "success" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Redirection automatique vers la page de connexion...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Se connecter maintenant
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Créer un nouveau compte
              </Link>
              <p className="text-xs text-zinc-500">
                Besoin d'aide ?{" "}
                <a href="mailto:contact@infomania.store" className="text-green-500 hover:text-green-400">
                  Contactez-nous
                </a>
              </p>
            </div>
          )}

          {status === "loading" && (
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
