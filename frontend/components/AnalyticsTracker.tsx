"use client";

import { useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AnalyticsTrackerProps {
  children?: React.ReactNode;
}

export function AnalyticsTracker({ children }: AnalyticsTrackerProps) {
  const sessionId = useRef<string>('');
  const isTracking = useRef(false);

  useEffect(() => {
    // Générer ou récupérer le sessionId
    if (typeof window !== 'undefined') {
      let storedSessionId = sessionStorage.getItem('analytics_session_id');
      
      if (!storedSessionId) {
        storedSessionId = generateSessionId();
        sessionStorage.setItem('analytics_session_id', storedSessionId);
      }
      
      sessionId.current = storedSessionId;
      
      // Démarrer le tracking
      if (!isTracking.current) {
        startTracking();
        isTracking.current = true;
      }
    }
  }, []);

  const generateSessionId = () => {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  };

  const getUserData = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const userStr = localStorage.getItem('auth_user');
      const adminStr = localStorage.getItem('adminInfo');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        return { userId: user.id, userType: 'user' };
      }
      
      if (adminStr) {
        const admin = JSON.parse(adminStr);
        return { userId: admin.id, userType: 'admin' };
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    
    return null;
  };

  const getClientInfo = () => {
    if (typeof window === 'undefined') return null;
    
    return {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      // Pour l'IP, on utilisera une requête backend ou un service tiers
      ip: 'unknown' // Sera mis à jour par le backend
    };
  };

  const trackPageView = async (url: string) => {
    // Protection contre les appels excessifs
    if (!sessionId.current || isTracking.current === false) return;
    
    try {
      const userData = getUserData();
      const clientInfo = getClientInfo();
      
      if (!clientInfo) return;

      // Timeout pour éviter les blocages
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${API_URL}/api/analytics/track/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId.current,
          userId: userData?.userId,
          url: url,
          referrer: clientInfo.referrer,
          userAgent: clientInfo.userAgent,
          ip: clientInfo.ip
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Silencieux en développement pour éviter la pollution des logs
        if (process.env.NODE_ENV === 'production') {
          console.error('Failed to track page view:', await response.text());
        }
      }
    } catch (error) {
      // Silencieux pour les erreurs de réseau ou timeout
      if (process.env.NODE_ENV === 'production' && error.name !== 'AbortError') {
        console.error('Error tracking page view:', error);
      }
    }
  };

  const trackEvent = async (type: string, category: string, action: string, label?: string, value?: number) => {
    // Protection contre les appels excessifs
    if (!sessionId.current || isTracking.current === false) return;
    
    try {
      const userData = getUserData();
      const clientInfo = getClientInfo();
      
      if (!clientInfo) return;

      // Timeout pour éviter les blocages
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${API_URL}/api/analytics/track/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId.current,
          userId: userData?.userId,
          type,
          category,
          action,
          label,
          value,
          url: clientInfo.url
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Silencieux en développement pour éviter la pollution des logs
        if (process.env.NODE_ENV === 'production') {
          console.error('Failed to track event:', await response.text());
        }
      }
    } catch (error) {
      // Silencieux pour les erreurs de réseau ou timeout
      if (process.env.NODE_ENV === 'production' && error.name !== 'AbortError') {
        console.error('Error tracking event:', error);
      }
    }
  };

  const startTracking = () => {
    // Tracker la page vue initiale
    trackPageView(window.location.href);

    // Tracker les changements de route (SPA)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => trackPageView(window.location.href), 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => trackPageView(window.location.href), 0);
    };

    // Écouter les événements popstate (navigation bouton retour/précédent)
    window.addEventListener('popstate', () => {
      setTimeout(() => trackPageView(window.location.href), 0);
    });

    // Tracker les clics sur les liens importants
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Tracker les clics sur les boutons et liens
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        const text = target.textContent?.trim() || '';
        const href = (target as HTMLAnchorElement).href;
        
        trackEvent('click', 'interaction', target.tagName.toLowerCase(), text);
        
        // Tracker les clics sur les liens externes
        if (href && href.startsWith('http') && !href.includes(window.location.hostname)) {
          trackEvent('click', 'external_link', 'click', href);
        }
      }
    });

    // Tracker les soumissions de formulaire
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      const formId = form.id || 'unknown_form';
      
      trackEvent('form_submit', 'form', 'submit', formId);
    });

    // Tracker les scrolls (pour mesurer l'engagement) - avec throttling
    let scrollTracked = false;
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!scrollTracked) {
          const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
          
          if (scrollPercentage > 50) {
            trackEvent('scroll', 'engagement', 'scroll_50_percent');
            scrollTracked = true;
          }
        }
      }, 100); // Throttle à 100ms
    });

    // Tracker l'engagement temps (toutes les 30 secondes) - avec protection
    let engagementCount = 0;
    const engagementInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && engagementCount < 10) { // Limiter à 10 événements
        trackEvent('engagement', 'time', '30_seconds');
        engagementCount++;
      }
    }, 30000);

    // Nettoyer l'intervalle quand la page est déchargée
    window.addEventListener('beforeunload', () => {
      clearInterval(engagementInterval);
      
      // Tracker la fin de session
      const sessionDuration = Date.now() - parseInt(sessionId.current.split('_')[2]);
      trackEvent('session_end', 'session', 'end', undefined, sessionDuration);
    });
  };

  // Exposer les fonctions de tracking globalement pour un usage manuel
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).analytics = {
        track: trackEvent,
        page: trackPageView,
        sessionId: sessionId.current
      };
    }
  }, []);

  return <>{children}</>;
}

// Hook pour utiliser le tracking dans les composants
export function useAnalytics() {
  if (typeof window === 'undefined') {
    return {
      track: () => {},
      page: () => {},
      sessionId: ''
    };
  }

  return {
    track: (window as any).analytics?.track || (() => {}),
    page: (window as any).analytics?.page || (() => {}),
    sessionId: (window as any).analytics?.sessionId || ''
  };
}
