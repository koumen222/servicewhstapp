"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { subscriptionsApi } from "@/lib/api";

type Status = "loading" | "success" | "failed" | "error";

function PaymentSuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref");
  const [status, setStatus] = useState<Status>("loading");
  const [plan, setPlan] = useState<string>("");

  useEffect(() => {
    if (!ref) {
      setStatus("error");
      return;
    }

    const check = async () => {
      try {
        const res = await subscriptionsApi.verifyPayment(ref);
        const data = res.data;
        setPlan(data.plan ?? "");
        if (data.status === "success") {
          setStatus("success");
          // Reload user data after 3s
          setTimeout(() => router.push("/dashboard"), 3000);
        } else if (data.status === "failed" || data.status === "cancelled") {
          setStatus("failed");
        } else {
          // Still pending — poll
          setTimeout(check, 3000);
        }
      } catch {
        setStatus("error");
      }
    };

    check();
  }, [ref]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-8 max-w-sm w-full text-center"
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        {status === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-[#22c55e] mx-auto mb-4" />
            <p className="text-[14px] font-semibold text-white">Vérification du paiement…</p>
            <p className="text-[12px] text-[#5a7a5a] mt-1">Réf: {ref}</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 size={48} className="text-[#22c55e] mx-auto mb-4" />
            </motion.div>
            <p className="text-[16px] font-bold text-white mb-1">Paiement réussi !</p>
            <p className="text-[12px] text-[#5a7a5a] mb-4">
              Votre plan <span className="text-[#22c55e] capitalize font-semibold">{plan}</span> est maintenant actif.
            </p>
            <p className="text-[11px] text-[#4a6a4a]">Redirection vers le tableau de bord…</p>
          </>
        )}

        {(status === "failed" || status === "error") && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-[16px] font-bold text-white mb-1">
              {status === "failed" ? "Paiement échoué" : "Erreur de vérification"}
            </p>
            <p className="text-[12px] text-[#5a7a5a] mb-4">
              {status === "failed"
                ? "Le paiement n'a pas pu être traité. Veuillez réessayer."
                : "Impossible de vérifier le paiement. Contactez le support."}
            </p>
            <button
              onClick={() => router.push("/dashboard/balance")}
              className="btn-green flex items-center gap-2 mx-auto"
            >
              Retour aux plans <ArrowRight size={13} />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#22c55e]" />
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}
