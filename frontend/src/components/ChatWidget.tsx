"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { api, resolveImageUrl } from "@/lib/api";
import { listingTypeStyles, priceLabel } from "@/lib/format";
import type { ChatSearchResponse, PropertyListItem } from "@/lib/types";

interface ChatEntry {
  id: number;
  role: "user" | "bot";
  text: string;
  results?: PropertyListItem[];
}

const SUGGESTIONS = [
  "retail shops for rent in Bengaluru under 50000",
  "office space for sale in Mumbai",
  "showroom for lease with parking",
];

let entryId = 0;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      id: entryId++,
      role: "bot",
      text: "Hi! Tell me what kind of shop you're looking for — e.g. \"retail shop for rent in Bengaluru under 50000\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, loading]);

  async function send(message: string) {
    const text = message.trim();
    if (!text || loading) return;

    setEntries((e) => [...e, { id: entryId++, role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post<ChatSearchResponse>("/chat/search", { message: text });
      setEntries((e) => [
        ...e,
        { id: entryId++, role: "bot", text: res.reply, results: res.results.items },
      ]);
    } catch {
      setEntries((e) => [
        ...e,
        {
          id: entryId++,
          role: "bot",
          text: "Something went wrong searching for that. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 hover:scale-105"
        aria-label="Search assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
            <Sparkles className="h-4 w-4" />
            <div>
              <p className="text-sm font-semibold">Shop Search Assistant</p>
              <p className="text-xs text-indigo-100">Ask in plain English</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {entries.map((entry) => (
              <div key={entry.id} className={entry.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    entry.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p>{entry.text}</p>
                  {entry.results && entry.results.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {entry.results.slice(0, 5).map((p) => {
                        const styles = listingTypeStyles(p.listing_type);
                        return (
                          <Link
                            key={p.id}
                            href={`/properties/${p.id}`}
                            className="flex gap-2 rounded-lg border border-gray-200 bg-white p-2 transition hover:border-indigo-300 hover:shadow-sm"
                          >
                            <div className="h-12 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                              {p.primary_image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={resolveImageUrl(p.primary_image_url)}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-gray-900">
                                {p.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {[p.locality?.name, p.city.name].filter(Boolean).join(", ")}
                              </p>
                              <p className={`text-xs font-bold ${styles.text}`}>
                                {priceLabel(p.listing_type, p.price)}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-400">
                  Searching…
                </div>
              </div>
            )}
          </div>

          {entries.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-3 py-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-gray-200 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. cafe for rent under 40k"
              className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
