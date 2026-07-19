"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ShareMenu({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function shareUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  async function handleShareClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl() });
      } catch {
        // user cancelled the native share sheet - nothing to do
      }
      return;
    }
    setOpen((o) => !o);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      toast.success("Link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link.");
    }
    setOpen(false);
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} - ${shareUrl()}`)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl())}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleShareClick}
        title="Share this listing"
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400" />
            )}
            Copy link
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <MessageCircle className="h-4 w-4 text-gray-400" />
            Share on WhatsApp
          </a>
          <a
            href={emailHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Mail className="h-4 w-4 text-gray-400" />
            Share via Email
          </a>
        </div>
      )}
    </div>
  );
}
