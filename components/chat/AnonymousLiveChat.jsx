"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function AnonymousLiveChat() {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selfLabel, setSelfLabel] = useState("");
  const [open, setOpen] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/live-chat", { cache: "no-store" });
      const data = await response.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setSelfLabel(data.selfLabel || "");
      setOpen(Boolean(data.open));
      if (!response.ok && data.error) setError(data.error);
    } catch {
      setError("تعذر تحديث المحادثة");
    }
  }, []);

  useEffect(() => {
    loadMessages();
    const timer = window.setInterval(loadMessages, 5000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    if (expanded && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [expanded, messages]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending || !open) return;

    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await response.json();
      setOpen(Boolean(data.open));
      if (!response.ok) {
        setError(data.error || "تعذر إرسال الرسالة");
        return;
      }
      setBody("");
      await loadMessages();
    } catch {
      setError("تعذر إرسال الرسالة");
    } finally {
      setSending(false);
    }
  }

  return (
    <div dir="rtl" className="fixed bottom-20 left-4 z-[70] sm:bottom-6 sm:left-6">
      {expanded ? (
        <section className="flex h-[min(72vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
          <header className="flex items-center justify-between bg-gradient-to-l from-emerald-700 to-emerald-500 px-4 py-3 text-white">
            <div>
              <h2 className="font-bold">المحادثة المباشرة</h2>
              <p className="text-xs text-white/85">{open ? `هويتك: ${selfLabel || "مجهول"}` : "مغلقة منذ الساعة 18:00"}</p>
            </div>
            <button type="button" onClick={() => setExpanded(false)} className="rounded-full p-2 hover:bg-white/15" aria-label="إغلاق المحادثة">
              <X size={20} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 dark:bg-slate-900">
            {messages.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                <p>لا توجد رسائل بعد.<br />ابدأ المحادثة باسم مجهول.</p>
              </div>
            ) : messages.map((message) => {
              const mine = message.anonymous_label === selfLabel;
              return (
                <article key={message.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"}`}>
                    <div className={`mb-1 text-[11px] font-bold ${mine ? "text-emerald-100" : "text-emerald-700 dark:text-emerald-300"}`}>{message.anonymous_label}</div>
                    <p className="break-words whitespace-pre-wrap">{message.body}</p>
                    <time className={`mt-1 block text-[10px] ${mine ? "text-emerald-100" : "text-slate-400"}`}>
                      {new Date(message.created_at).toLocaleTimeString("ar-MR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nouakchott" })}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
            {error ? <p className="mb-2 text-center text-xs font-semibold text-red-600">{error}</p> : null}
            {open ? (
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  value={body}
                  onChange={(event) => setBody(event.target.value.slice(0, 300))}
                  placeholder="اكتب رسالة..."
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900"
                  maxLength={300}
                />
                <button disabled={sending || !body.trim()} className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white disabled:cursor-not-allowed disabled:opacity-50" aria-label="إرسال">
                  <Send size={18} />
                </button>
              </form>
            ) : (
              <p className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">تم إغلاق المحادثة اليوم عند الساعة 18:00.</p>
            )}
          </div>
        </section>
      ) : (
        <button type="button" onClick={() => setExpanded(true)} className="relative grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-[0_16px_40px_rgba(5,150,105,.38)] transition hover:scale-105" aria-label="فتح المحادثة المباشرة">
          <MessageCircle size={26} />
          {open && messages.length > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold">{Math.min(messages.length, 99)}</span> : null}
        </button>
      )}
    </div>
  );
}
