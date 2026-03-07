"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, Send, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/store/useStore";
import { setCookie } from "@/lib/utils";
import type { User } from "@/lib/types";

type Step = "name" | "phone" | "form" | "submitting" | "done";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: Date;
}

const FEATURES = [
  "Jusqu'à 1 instance WhatsApp gratuite",
  "Accès API avec webhooks",
  "Suivi des messages en temps réel",
  "Évoluez à tout moment vers plus d'instances",
];

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [step, setStep] = useState<Step>("name");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Bonjour ! 👋 Je suis ravi de vous aider à créer votre compte. Pour commencer, comment vous appelez-vous ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const addMessage = (type: "bot" | "user", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addBotMessage = (content: string, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage("bot", content);
    }, delay);
  };

  const validatePhone = (phone: string): boolean => {
    // Accept international phone numbers with country code (+XXX)
    // Must start with + and have at least 10 digits total
    const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
    const cleanPhone = phone.replace(/\s/g, "");
    return phoneRegex.test(cleanPhone);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userInput = input.trim();
    setInput("");
    setError(null);
    addMessage("user", userInput);

    if (step === "name") {
      if (userInput.length < 2) {
        addBotMessage("❌ Votre nom doit contenir au moins 2 caractères.", 500);
        return;
      }
      setFormData((prev) => ({ ...prev, name: userInput }));
      addBotMessage("Enchanté ! � Maintenant, quel est votre numéro de téléphone avec l'indicatif pays ?");
      setStep("phone");
    } else if (step === "phone") {
      if (!validatePhone(userInput)) {
        addBotMessage("❌ Ce numéro ne semble pas valide. Veuillez entrer un numéro avec l'indicatif pays (ex: +237612345678, +33612345678, +1234567890).", 500);
        return;
      }
      setFormData((prev) => ({ ...prev, phone: userInput }));
      addBotMessage("Parfait ! � Pour finaliser votre inscription, veuillez remplir le formulaire ci-dessous.", 800);
      setTimeout(() => {
        setStep("form");
      }, 1200);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    if (!validateEmail(formData.email)) {
      setError("Adresse email invalide");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setStep("submitting");
    setError(null);

      try {
        
        // Determine API URL using same logic as lib/api.ts
        const getApiUrl = () => {
          if (typeof window !== "undefined") {
            const hostname = window.location.hostname;
            if (hostname === "zechat.site" || hostname === "www.zechat.site" || 
                hostname === "ecomcookpit.site" || hostname === "www.ecomcookpit.site" ||
                !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
              return "https://api.ecomcookpit.site";
            }
          }
          if (process.env.NEXT_PUBLIC_API_URL) {
            return process.env.NEXT_PUBLIC_API_URL;
          }
          return "http://localhost:3001";
        };
        
        const apiUrl = getApiUrl();
        console.log('🔗 Using API URL:', apiUrl);
        
        // Call register API with phone number
        const response = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            password: formData.password,
            phone: formData.phone,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Échec de l'inscription");
        }

        const { token, user, message } = data;

        // Store token and user data
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
        setCookie("auth_token", token, 7);

        setUser(user as User);
        setStep("done");
        addMessage("bot", `🎉 ${message || "Compte créé avec succès !"} Redirection vers votre tableau de bord...`);
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 2500);
      } catch (err: unknown) {
        const msg = (err as any)?.message || (err as any)?.response?.data?.error || "Échec de l'inscription. Veuillez réessayer.";
        setError(msg);
        setStep("form");
      }
  };

  return (
    <div className="min-h-screen flex bg-grid-green" style={{ background: 'var(--bg-main)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10" style={{ borderRight: '1px solid var(--table-border)' }}>
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
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
          style={{ background: "var(--green-bg-subtle)", border: "1px solid var(--green-border-subtle)" }}
        >
          <p className="text-[12px] text-[#22c55e] font-semibold mb-1">
            Le plan gratuit inclut
          </p>
          <p className="text-[12px] text-[#5a7a5a]">
            1 instance · 1 000 messages/mois · Accès complet à l'API
          </p>
        </div>
      </div>

      {/* Right panel - Chat Interface */}
      <div className="flex-1 flex flex-col p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-2xl mx-auto flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <Link href="/login" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              Se connecter
            </Link>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Créer votre compte</h1>
            </div>
            <p className="text-[13px] text-[#5a7a5a]">
              Répondez aux questions de notre assistant pour créer votre compte en quelques secondes
            </p>
          </div>

          {/* Chat Messages */}
          {step !== "form" && (
            <>
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 no-scrollbar">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.type === "user"
                            ? "bg-green-600 text-white rounded-tr-sm"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    step === "name"
                      ? "Ex: Moussa Traoré"
                      : step === "phone"
                      ? "Ex: +237612345678 ou +33612345678"
                      : "Tapez votre réponse..."
                  }
                  disabled={step === "submitting" || step === "done" || isTyping}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || step === "submitting" || step === "done" || isTyping}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {step === "submitting" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            </>
          )}

          {/* Classic Form (appears after chatbot) */}
          {step === "form" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="w-full max-w-md">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre.email@exemple.com"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Minimum 6 caractères"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création du compte...
                      </>
                    ) : (
                      "Créer mon compte"
                    )}
                  </button>

                  <p className="text-center text-xs text-zinc-600">
                    Déjà un compte ?{" "}
                    <Link href="/login" className="text-green-500 hover:text-green-400 font-medium transition-colors">
                      Se connecter
                    </Link>
                  </p>
                </form>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-[#3a5a3a]">
              En vous inscrivant, vous acceptez nos{" "}
              <span className="text-[#22c55e]">Conditions d'utilisation</span> et notre{" "}
              <span className="text-[#22c55e]">Politique de confidentialité</span>.
            </p>
            <p className="text-center text-[13px] text-[#5a7a5a] mt-3 hidden lg:block">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-[#22c55e] hover:text-[#4ade80] font-medium transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
