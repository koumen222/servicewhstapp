"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type Locale = "fr" | "en";

const translations = {
  fr: {
    // Page titles
    "page.dashboard": "Tableau de bord",
    "page.instances": "Instances",
    "page.chats": "Conversations",
    "page.api": "API",
    "page.balance": "Solde",
    "page.purchases": "Achats",
    "page.integrations": "Intégrations",
    "page.proxy": "Proxy",
    "page.account": "Compte",
    "page.admin.users": "Utilisateurs",
    "page.admin.instances": "Toutes les Instances",
    "page.admin.plans": "Plans",

    // Header
    "header.notifications": "Notifications",
    "header.theme.light": "Mode clair",
    "header.theme.dark": "Mode sombre",
    "header.language": "Langue",

    // User menu
    "user.account": "Compte",
    "user.settings": "Paramètres",
    "user.logout": "Déconnexion",
    "user.plan": "Plan",

    // Payment banner
    "banner.payment.title": "Paiement requis.",
    "banner.payment.desc": "Une ou plusieurs instances ont expiré.",
    "banner.payment.short": "Instance(s) expirée(s).",
    "banner.payment.cta": "Payer maintenant →",

    // Sidebar
    "sidebar.main": "Principal",
    "sidebar.admin": "Admin",
    "sidebar.instances": "Instances",
    "sidebar.chats": "Conversations",
    "sidebar.api": "API",
    "sidebar.balance": "Solde",
    "sidebar.purchases": "Achats",
    "sidebar.integrations": "Intégrations",
    "sidebar.proxy": "Proxy",
    "sidebar.account": "Compte",
    "sidebar.docs": "Documentation",
    "sidebar.admin.users": "Utilisateurs",
    "sidebar.admin.instances": "Toutes les Instances",
    "sidebar.logout": "Déconnexion",
    "sidebar.user.default": "Utilisateur",
  },
  en: {
    // Page titles
    "page.dashboard": "Dashboard",
    "page.instances": "Instances",
    "page.chats": "Conversations",
    "page.api": "API",
    "page.balance": "Balance",
    "page.purchases": "Purchases",
    "page.integrations": "Integrations",
    "page.proxy": "Proxy",
    "page.account": "Account",
    "page.admin.users": "Users",
    "page.admin.instances": "All Instances",
    "page.admin.plans": "Plans",

    // Header
    "header.notifications": "Notifications",
    "header.theme.light": "Light mode",
    "header.theme.dark": "Dark mode",
    "header.language": "Language",

    // User menu
    "user.account": "Account",
    "user.settings": "Settings",
    "user.logout": "Log out",
    "user.plan": "Plan",

    // Payment banner
    "banner.payment.title": "Payment required.",
    "banner.payment.desc": "One or more instances have expired.",
    "banner.payment.short": "Expired instance(s).",
    "banner.payment.cta": "Pay now →",

    // Sidebar
    "sidebar.main": "Main",
    "sidebar.admin": "Admin",
    "sidebar.instances": "Instances",
    "sidebar.chats": "Conversations",
    "sidebar.api": "API",
    "sidebar.balance": "Balance",
    "sidebar.purchases": "Purchases",
    "sidebar.integrations": "Integrations",
    "sidebar.proxy": "Proxy",
    "sidebar.account": "Account",
    "sidebar.docs": "Documentation",
    "sidebar.admin.users": "Users",
    "sidebar.admin.instances": "All Instances",
    "sidebar.logout": "Log out",
    "sidebar.user.default": "User",
  },
} as const;

type TranslationKey = keyof typeof translations.fr;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("app_locale") as Locale | null;
    if (saved && (saved === "fr" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("app_locale", l);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
