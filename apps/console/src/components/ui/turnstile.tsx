"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileProps = {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export function Turnstile({
  onVerify,
  onError,
  onExpire,
  theme = "light",
  size = "normal",
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify],
  );

  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else if (window.turnstile) {
      setIsLoaded(true);
    } else {
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) return;

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: handleVerify,
      "error-callback": handleError,
      "expired-callback": handleExpire,
      theme,
      size,
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [isLoaded, handleVerify, handleError, handleExpire, theme, size]);

  if (!TURNSTILE_SITE_KEY) return null;

  return <div ref={containerRef} className={className} />;
}

export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setToken(null);
    setError(true);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setError(false);
  }, []);

  return {
    token,
    error,
    isVerified: !!token,
    handleVerify,
    handleError,
    handleExpire,
    reset,
  };
}
