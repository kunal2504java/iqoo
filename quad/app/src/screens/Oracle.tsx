import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Send, Clock, ShieldCheck,
  FileText, Briefcase, CalendarDays, Zap,
} from "lucide-react";
import { api } from "../api";
import type { Post } from "../api";

interface Message {
  id: string;
  role: "user" | "oracle";
  text: string;
  sources?: {
    post: Post;
    author: { name: string; avatar?: string; branch: string; year: string };
    match_reason: string;
  }[];
  deadlines?: { title: string; days_until: number; kind: string }[];
  usedFallback?: boolean;
}

export default function Oracle() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "oracle",
      text: "I'm the Campus Oracle. Ask me anything your campus knows — notes, drives, deadlines, or subjects. I synthesize answers from verified senior memory.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const ask = async () => {
    if (!query.trim() || loading) return;
    const q = query.trim();
    setQuery("");
    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.askOracle(q);
      const oracleMsg: Message = {
        id: `o_${Date.now()}`,
        role: "oracle",
        text: res.answer,
        sources: res.sources.map((s) => ({
          post: s.post,
          author: s.author,
          match_reason: s.match_reason,
        })),
        deadlines: res.deadlines.map((d) => ({
          title: d.title,
          days_until: d.days_until,
          kind: d.kind,
        })),
        usedFallback: res.used_fallback,
      };
      setMessages((prev) => [...prev, oracleMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `o_${Date.now()}`,
          role: "oracle",
          text: "The Oracle is temporarily out of reach. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "GATE thermodynamics tips",
    "When does Razorpay drive close?",
    "Explain normalization",
    "Best DSA notes for placements",
    "Hackathon events this week",
  ];

  return (
    <div className="flex min-h-safe flex-col bg-canvas">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-canvas/95 px-4 pt-safe pb-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-hairline bg-surface text-m-blue">
            <Sparkles size={12} />
          </div>
          <div>
            <h1 className="font-display text-sm uppercase tracking-wide">Campus Oracle</h1>
            <p className="text-[10px] text-muted machined">Ask the entire campus</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx === messages.length - 1 ? 0.1 : 0 }}
              className={`mb-5 ${msg.role === "user" ? "flex justify-end" : ""}`}
            >
              {msg.role === "oracle" && (
                <div className="max-w-[92%]">
                  {/* Oracle avatar row */}
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center border border-hairline bg-surface text-m-blue">
                      <Zap size={10} />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted machined">Campus Oracle</span>
                    {msg.usedFallback && (
                      <span className="text-[9px] text-muted">· offline mode</span>
                    )}
                  </div>

                  {/* M-stripe accent bar */}
                  <div className="h-[2px] w-8 m-stripe mb-0" />

                  {/* Answer */}
                  <div className="border border-hairline bg-surface p-3 text-sm leading-relaxed text-body">
                    {msg.text}
                  </div>

                  {/* Deadlines */}
                  {msg.deadlines && msg.deadlines.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.deadlines.map((d) => (
                        <div
                          key={d.title}
                          className={`flex items-center gap-2 border-l-2 bg-surface px-2 py-2 text-[11px] ${
                            d.days_until <= 4 ? "border-m-red text-m-red" : "border-m-blue text-m-blue"
                          }`}
                        >
                          <Clock size={12} />
                          <span className="font-medium text-body">{d.title}</span>
                          <span className="opacity-70">
                            — {d.days_until <= 0 ? "today" : `${d.days_until} days`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-muted machined">
                        Synthesized from {msg.sources.length} verified source{msg.sources.length > 1 ? "s" : ""}
                      </div>
                      <div className="space-y-2">
                        {msg.sources.map((s) => (
                          <button
                            key={s.post.id}
                            onClick={() => navigate(`/post/${s.post.id}`)}
                            className="w-full text-left border border-hairline bg-surface p-2.5 transition-colors hover:border-ink hover:bg-surface/80"
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-muted">
                              {s.post.type === "note" && <FileText size={10} className="text-m-blue" />}
                              {s.post.type === "drive" && <Briefcase size={10} className="text-m-blue" />}
                              {s.post.type === "event" && <CalendarDays size={10} className="text-m-blue" />}
                              <span className="uppercase tracking-wider machined">{s.post.type}</span>
                              <span className="text-hairline">·</span>
                              <ShieldCheck size={10} className="text-success" />
                              <span>{s.post.trust.verified_by}</span>
                              {s.post.trust.topped_exam > 0 && (
                                <span className="text-m-blue">· topped: {s.post.trust.topped_exam}</span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs font-medium text-ink line-clamp-1">{s.post.title}</div>
                            <div className="mt-0.5 text-[10px] text-muted">
                              {s.author.avatar} {s.author.name} · {s.match_reason}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {msg.role === "user" && (
                <div className="max-w-[85%] border border-hairline bg-surface px-3 py-2 text-sm text-ink">
                  {msg.text}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex items-start gap-2"
          >
            <div className="flex h-5 w-5 items-center justify-center border border-hairline bg-surface text-m-blue">
              <Zap size={10} />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-2 w-32 animate-pulse bg-carbon" />
              <div className="h-2 w-48 animate-pulse bg-carbon" />
              <div className="h-2 w-24 animate-pulse bg-carbon" />
            </div>
          </motion.div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggestions (only when empty-ish) */}
      {messages.length <= 1 && !loading && (
        <div className="px-4 pb-2">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted machined">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="chip bg-surface text-[10px] hover:border-ink transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-hairline bg-canvas/95 p-3 backdrop-blur">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask the campus anything…"
            className="input flex-1 text-xs"
          />
          <button onClick={ask} disabled={loading} className="btn btn-fill px-4">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
