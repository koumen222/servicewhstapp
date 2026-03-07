"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!canResend || !email) return;
    
    // TODO: Implement resend email logic
    setCountdown(60);
    setCanResend(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-grid-green p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
          {/* Icon */}
          <div className="mb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
              className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4"
            >
              <Mail className="h-10 w-10 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Vérifiez votre email
            </h1>
            <p className="text-sm text-zinc-400">
              Nous avons envoyé un lien de vérification à
            </p>
            <p className="text-sm font-semibold text-green-500 mt-1">
              {email || "votre adresse email"}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Étapes suivantes :
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Ouvrez votre boîte de réception email",
                  "Recherchez l'email de ZeChat.site",
                  "Cliquez sur le bouton de vérification",
                  "Connectez-vous à votre compte"
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-zinc-400">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-400 leading-relaxed">
                <strong>⚠️ Important :</strong> Le lien de vérification est valide pendant 24 heures. 
                Vérifiez également votre dossier spam si vous ne voyez pas l'email.
              </p>
            </div>
          </div>

          {/* Resend button */}
          <div className="text-center mb-6">
            <p className="text-xs text-zinc-500 mb-3">
              Vous n'avez pas reçu l'email ?
            </p>
            <button
              onClick={handleResendEmail}
              disabled={!canResend}
              className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {canResend ? (
                <>
                  Renvoyer l'email <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                `Renvoyer dans ${countdown}s`
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-950 px-2 text-zinc-600">ou</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="block text-center bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              J'ai déjà vérifié mon email
            </Link>
            <Link
              href="/"
              className="block text-center text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>

        {/* Help */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-600">
            Besoin d'aide ?{" "}
            <a
              href="mailto:contact@infomania.store"
              className="text-green-500 hover:text-green-400 transition-colors"
            >
              Contactez notre support
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
