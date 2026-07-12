"use client";

import { useRef } from "react";
import Script from "next/script";
import { useAuth } from "@/lib/auth-context";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export default function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  function renderButton() {
    if (!clientId || !buttonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await loginWithGoogle(response.credential);
          onSuccess?.();
        } catch {
          onError?.("Google sign-in failed. Please try again.");
        }
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
    });
  }

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={renderButton}
      />
      <div ref={buttonRef} className="flex justify-center" />
    </>
  );
}
