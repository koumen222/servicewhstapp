"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock, CreditCard, X } from "lucide-react";
import { useAppStore } from "@/store/useStore";
import Link from "next/link";

export function TrialBanner() {
  const { user } = useAppStore();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Si l'utilisateur a déjà payé, ne pas afficher la bannière
    if (user.isPaidAccount || user.hasPaid) {
      setIsVisible(false);
      return;
    }

    // Calculer les jours restants
    if (user.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysRemaining(Math.max(0, diffDays));
      
      // Si l'essai est expiré, toujours afficher
      if (diffDays <= 0) {
        setIsVisible(true);
      }
    }
  }, [user]);

  if (!isVisible || !user || daysRemaining === null) {
    return null;
  }

  const isExpired = daysRemaining === 0;

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border ${
        isExpired
          ? "bg-red-500/10 border-red-500/30"
          : "bg-yellow-500/10 border-yellow-500/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isExpired ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <Clock className="w-5 h-5 text-yellow-400" />
          )}
        </div>
        
        <div className="flex-1">
          {isExpired ? (
            <>
              <h3 className="text-sm font-semibold text-red-400 mb-1">
                Période d'essai expirée
              </h3>
              <p className="text-xs text-red-300 mb-3">
                Votre période d'essai gratuit de 3 jours est terminée. Pour continuer à utiliser le service, 
                veuillez effectuer un paiement.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/balance"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Effectuer un paiement
                </Link>
                <a
                  href="https://wa.me/237676778377?text=Bonjour%2C%20je%20souhaite%20souscrire%20au%20plan%20Basic%20%C3%A0%203%20000%20XAF%2Fmois"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Payer via WhatsApp
                </a>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-yellow-400 mb-1">
                Essai gratuit - {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
              </h3>
              <p className="text-xs text-yellow-300 mb-2">
                Profitez de toutes les fonctionnalités du plan Basic gratuitement pendant {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}. 
                Après cette période, vous devrez effectuer un paiement pour continuer.
              </p>
              <Link
                href="/dashboard/balance"
                className="inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Voir les plans disponibles →
              </Link>
            </>
          )}
        </div>

        {!isExpired && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 hover:bg-yellow-500/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-yellow-400" />
          </button>
        )}
      </div>
    </div>
  );
}
