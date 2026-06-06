import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShieldCheck, RotateCcw, Send, BookOpen, Lightbulb, Layers, ExternalLink,
  MessageCircle, Crown, Rocket, GraduationCap, Building2, Coins, Heart,
} from "lucide-react";
import type { Post } from "../api";
import { api, imageUrl } from "../api";
import { useAuth } from "../context/AuthContext";

const ROLE_ICON: Record<string, React.ElementType> = {
  student: GraduationCap,
  senior: Crown,
  alumni: Rocket,
  admin: Building2,
};

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  senior: "Senior",
  alumni: "Alumni",
  admin: "Office",
};

const ROLE_COLOR: Record<string, string> = {
  student: "text-body border-hairline",
  senior: "text-warning border-warning/40 bg-warning/10",
  alumni: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  admin: "text-m-red border-m-red/40 bg-m-red/10",
};



export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "flashcards" | "ghost">("summary");
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const [tipping, setTipping] = useState(false);
  const [tipSent, setTipSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.postDetail(id).then(setPost).finally(() => setLoading(false));
  }, [id]);

  const ask = async () => {
    if (!post || !question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setChat((prev) => [...prev, { q, a: "" }]);
    setAsking(true);
    try {
      const res = await api.askGhostSenior(post.id, q);
      setChat((prev) => { const next = [...prev]; next[next.length - 1].a = res.answer; return next; });
    } catch {
      setChat((prev) => { const next = [...prev]; next[next.length - 1].a = "The senior's memory is hazy on that one. Try rephrasing?"; return next; });
    } finally {
      setAsking(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  };

  const verify = async () => {
    if (!post) return;
    try {
      const res = await api.verifyPost(post.id);
      setPost((p) => (p ? { ...p, trust: res.trust } : p));
    } catch {}
  };

  const tip = async (amount: number) => {
    if (!post) return;
    setTipping(true);
    try {
      const res = await api.tipPost(post.id, amount);
      setPost((p) => (p ? { ...p, author: res.author, tip_count: res.tip_count } : p));
      setTipSent(true);
      setTimeout(() => setTipSent(false), 3000);
    } catch {}
    setTipping(false);
  };

  if (loading) {
    return (
      <div className="min-h-safe bg-canvas px-4 pt-safe">
        <div className="py-10 text-center text-sm text-muted">Loading memory…</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-safe bg-canvas px-4 pt-safe">
        <div className="py-10 text-center text-sm text-muted">Note not found.</div>
      </div>
    );
  }

  const isNote = post.type === "note";
  const isDrive = post.type === "drive";
  const isEvent = post.type === "event";
  const author = post.author;
  const RoleIcon = author ? ROLE_ICON[author.role] || GraduationCap : GraduationCap;
  const roleColor = author ? ROLE_COLOR[author.role] : "";
  const roleLabel = author ? ROLE_LABEL[author.role] : "";
  const isOwnPost = user?.id === post.author_id;

  return (
    <div className="min-h-safe bg-canvas">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-canvas/95 px-4 pt-safe pb-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 truncate text-sm font-medium">{post.title}</div>
        <button onClick={verify} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-success">
          <ShieldCheck size={12} />
          {post.trust.verified_by}
        </button>
      </div>

      <div className="px-4 pb-8">
        {/* Author card — visually distinct by role */}
        <div className="mt-4 border border-hairline bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border border-hairline bg-canvas text-2xl">
              {author?.avatar || "👤"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{author?.name}</span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] machined border ${roleColor}`}>
                  <RoleIcon size={9} />
                  {roleLabel}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted">
                {author?.branch} · Year {author?.year}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                <span className="flex items-center gap-1 text-m-blue">
                  <Coins size={10} />
                  {author?.points ?? 0} pts
                </span>
                <span className="text-hairline">·</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-3 flex items-center gap-3 border-t border-hairline pt-3 text-[11px]">
            <span className="flex items-center gap-1 text-success">
              <ShieldCheck size={12} />
              Verified by {post.trust.verified_by}
            </span>
            {post.trust.topped_exam > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <Crown size={12} />
                Topped exam: {post.trust.topped_exam}
              </span>
            )}
          </div>

          {/* Tip the senior */}
          {!isOwnPost && (
            <div className="mt-3 border-t border-hairline pt-3">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted">
                <span>Found this useful? Tip the author</span>
                <span className="flex items-center gap-1 text-m-red">
                  <Heart size={10} /> {post.tip_count ?? 0}/50
                </span>
              </div>
              {/* Progress bar */}
              <div className="mb-3 h-1.5 w-full bg-hairline overflow-hidden">
                <div
                  className="h-full bg-m-red transition-all duration-500"
                  style={{ width: `${Math.min(100, ((post.tip_count || 0) / 50) * 100)}%` }}
                />
              </div>
              {(post.tip_count || 0) >= 50 ? (
                <div className="flex items-center gap-2 text-[11px] text-m-red">
                  <Heart size={12} className="fill-m-red" />
                  <span>This note is a campus legend — 50 students found it useful. Tipping is closed.</span>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    {[5, 10, 20].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => tip(amt)}
                        disabled={tipping}
                        className="btn btn-ghost flex-1 gap-1 text-[11px]"
                      >
                        <Heart size={12} className="text-m-red" /> +{amt}
                      </button>
                    ))}
                  </div>
                  {tipSent && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-[11px] text-success"
                    >
                      Thanks for supporting the campus memory! 🎉
                    </motion.div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="mt-4 overflow-hidden border border-hairline">
            <img src={imageUrl(post.image_url)} alt="" className="w-full object-cover" />
          </div>
        )}

        {/* Drive details */}
        {isDrive && post.drive && (
          <div className="mt-4 border border-hairline bg-surface p-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-muted">Role</div><div className="text-ink font-medium">{post.drive.role}</div></div>
              <div><div className="text-muted">CTC</div><div className="text-ink font-medium">{post.drive.ctc}</div></div>
              <div><div className="text-muted">Eligibility</div><div className="text-ink font-medium">{post.drive.eligibility}</div></div>
              <div><div className="text-muted">Deadline</div><div className="text-ink font-medium">{post.drive.deadline}</div></div>
            </div>
            <button onClick={() => navigate(`/drive/${post.id}/candidates`)} className="btn btn-blue mt-4 w-full">
              See matching candidates
            </button>
          </div>
        )}

        {/* Event details */}
        {isEvent && post.event && (
          <div className="mt-4 border border-hairline bg-surface p-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-muted">Venue</div><div className="text-ink font-medium">{post.event.venue}</div></div>
              <div><div className="text-muted">When</div><div className="text-ink font-medium">{post.event.start_time}</div></div>
              <div><div className="text-muted">RSVP</div><div className="text-ink font-medium">{post.event.rsvp_count}</div></div>
            </div>
          </div>
        )}

        {/* Note tabs */}
        {isNote && post.enrichment && (
          <>
            <div className="mt-6 flex gap-2 border-b border-hairline pb-2">
              {[
                { key: "summary", label: "Summary", icon: BookOpen },
                { key: "flashcards", label: "Flashcards", icon: Layers },
                { key: "ghost", label: "Ghost Senior", icon: MessageCircle },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] machined border transition-colors ${
                    activeTab === t.key ? "border-m-blue text-ink bg-m-blue/15" : "border-hairline text-muted hover:text-body"
                  }`}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "summary" && (
                <motion.div key="summary" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-5">
                  <div className="text-sm leading-relaxed text-body">{post.enrichment.summary}</div>
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                      <Lightbulb size={12} /> Key Points
                    </h4>
                    <ul className="space-y-2.5">
                      {post.enrichment.key_points.map((p, i) => (
                        <li key={i} className="flex gap-3 text-xs text-body">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 bg-m-blue" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                      <ExternalLink size={12} /> Resources
                    </h4>
                    <div className="space-y-2">
                      {post.enrichment.resources.map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noreferrer" className="block border border-hairline bg-surface px-3 py-2.5 text-xs text-m-blue hover:border-m-blue">
                          {r.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "flashcards" && (
                <motion.div key="flashcards" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-3">
                  {post.enrichment.flashcards.map((fc, i) => (
                    <Flashcard key={i} index={i} q={fc.q} a={fc.a} />
                  ))}
                </motion.div>
              )}

              {activeTab === "ghost" && (
                <motion.div key="ghost" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                  <div className="mb-2 text-xs text-muted">Ask this note a question. The senior answers.</div>
                  <div className="max-h-[40vh] overflow-y-auto no-scrollbar space-y-3 pr-1">
                    {chat.map((c, i) => (
                      <div key={i} className="space-y-1">
                        <div className="border border-hairline bg-surface px-3 py-2 text-xs text-ink">{c.q}</div>
                        <div className="border border-m-blue/30 bg-m-blue/10 px-3 py-2 text-xs text-body leading-relaxed">
                          {c.a || (
                            <span className="flex items-center gap-1 text-muted animate-pulse">
                              <RotateCcw size={12} className="animate-spin" /> Thinking…
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()}
                      placeholder="Ask anything about this note…" className="input flex-1 text-xs" />
                    <button onClick={ask} disabled={asking} className="btn btn-fill px-4"><Send size={14} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

function Flashcard({ index, q, a }: { index: number; q: string; a: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.button layout onClick={() => setFlipped((f) => !f)}
      className="w-full text-left border border-hairline bg-surface p-4 transition-colors hover:border-ink">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">Flashcard {index + 1}</div>
      <AnimatePresence mode="wait">
        {flipped ? (
          <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs leading-relaxed text-success">
            {a}
          </motion.div>
        ) : (
          <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-ink">
            {q}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-2 text-[10px] text-muted">{flipped ? "Tap to see question" : "Tap to reveal answer"}</div>
    </motion.button>
  );
}
