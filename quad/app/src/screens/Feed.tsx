import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Briefcase,
  ShieldCheck, Clock, ChevronRight, Zap, Sparkles, Map, Trophy, Heart,
  GraduationCap, Rocket, Crown, Building2,
} from "lucide-react";
import type { Post, MemoryCard, Stats } from "../api";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const TYPE_ACCENT: Record<string, string> = {
  note: "border-l-m-blue",
  event: "border-l-orange-400",
  drive: "border-l-success",
  announcement: "border-l-muted",
  menu: "border-l-warning",
};

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

function typeLabel(t: string) {
  return t === "note" ? "Note" : t === "event" ? "Event" : t === "drive" ? "Drive" : t === "menu" ? "Menu" : "Announcement";
}

function timeAgo(iso: string) {
  const h = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3600_000));
  if (h < 1) return "now";
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Post[]>([]);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.feed();
      setItems(data.items);
      setMemoryCards(data.memory_cards);
      setStats(data.stats);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-safe bg-canvas px-4 pt-safe">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl uppercase tracking-tight">Quad</h1>
            <p className="mt-0.5 text-[11px] text-muted">The campus stops forgetting</p>
          </div>
          <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-right">
            <div>
              <div className="text-[10px] text-muted">{user?.points ?? 0} pts</div>
              <div className="text-[10px] text-m-blue font-medium">{user?.name?.split(" ")[0]}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center border border-hairline bg-surface text-xl">
              {user?.avatar || "👤"}
            </div>
          </button>
        </div>

        {/* Compounding counter */}
        {stats && (
          <div className="mt-3 flex items-center gap-4 border-y border-hairline py-2.5">
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-m-blue" />
              <span className="text-[11px] text-muted"><span className="text-ink font-semibold">{stats.notes}</span> notes</span>
            </div>
            <div className="h-3 w-px bg-hairline" />
            <div className="flex items-center gap-1.5">
              <Briefcase size={13} className="text-success" />
              <span className="text-[11px] text-muted"><span className="text-ink font-semibold">{stats.drives}</span> drives</span>
            </div>
            <div className="h-3 w-px bg-hairline" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-warning" />
              <span className="text-[11px] text-muted"><span className="text-ink font-semibold">{stats.enrichments}</span> enrichments</span>
            </div>
          </div>
        )}
      </div>

      {/* Memory cards (F6) */}
      {memoryCards.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
            <Clock size={12} className="text-m-red" />
            <span>Campus Memory warns you first</span>
          </div>
          <AnimatePresence>
            {memoryCards.slice(0, 2).map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 border-l-4 bg-surface p-4 ${
                  card.urgency === "high" ? "border-m-red" : card.urgency === "medium" ? "border-m-blue" : "border-muted"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={`text-[10px] machined px-2 py-0.5 ${card.urgency === "high" ? "bg-m-red/15 text-m-red" : "bg-m-blue/15 text-m-blue"}`}>
                    {card.urgency === "high" ? "URGENT" : card.urgency === "medium" ? "SOON" : "UPCOMING"}
                  </span>
                  <span className="text-[10px] text-muted">{card.days_until <= 0 ? "today" : `${card.days_until} days`}</span>
                </div>
                <h3 className="text-sm font-medium text-ink">{card.headline}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{card.subline}</p>
                {card.evidence.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {card.evidence.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => navigate(`/post/${ev.id}`)}
                        className="inline-flex items-center gap-1 rounded-none bg-canvas px-2 py-1 text-[10px] text-body border border-hairline hover:border-ink transition-colors"
                      >
                        <FileText size={10} />
                        {ev.title}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={async () => { try { await api.ackMemory(card.event.id); load(); } catch {} }}
                  className="mt-3 text-[11px] uppercase tracking-wider text-m-blue underline underline-offset-2"
                >
                  {card.cta}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-muted">Your personalized feed</div>
        <button onClick={() => navigate("/map")} className="flex items-center gap-1 text-[10px] text-m-blue hover:underline">
          <Map size={12} /> Campus Map
        </button>
      </div>

      {/* Feed */}
      {loading && items.length === 0 && (
        <div className="space-y-4 py-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse bg-surface border border-hairline" />
          ))}
        </div>
      )}

      {error && (
        <div className="py-10 text-center text-sm text-m-red">{error}</div>
      )}

      <div className="space-y-4 pb-24">
        {items.map((post, idx) => {
          const accent = TYPE_ACCENT[post.type] || "border-l-muted";
          const author = post.author;
          const RoleIcon = author ? ROLE_ICON[author.role] || GraduationCap : GraduationCap;
          const roleColor = author ? ROLE_COLOR[author.role] : "";
          const roleLabel = author ? ROLE_LABEL[author.role] : "";

          return (
            <motion.button
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => navigate(`/post/${post.id}`)}
              className={`w-full text-left border border-hairline border-l-4 ${accent} bg-surface p-4 transition-colors hover:border-ink hover:bg-surface/80`}
            >
              {/* Top row: type + role badge + match reason */}
              <div className="mb-2.5 flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] machined border ${roleColor}`}>
                  <RoleIcon size={10} />
                  {roleLabel}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted">{typeLabel(post.type)}</span>
                {post.matched && (
                  <span className="ml-auto text-[10px] text-m-blue">{post.match_reason}</span>
                )}
              </div>

              <h3 className="text-sm font-medium leading-snug text-ink">{post.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted leading-relaxed">{post.description}</p>

              {/* Meta row */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <span className="text-base">{author?.avatar || "👤"}</span>
                  <span className="text-body">{author?.name}</span>
                  <span className="text-hairline">·</span>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  {post.trust.verified_by > 0 && (
                    <span className="flex items-center gap-1 text-success">
                      <ShieldCheck size={10} />
                      {post.trust.verified_by}
                    </span>
                  )}
                  {post.trust.topped_exam > 0 && (
                    <span className="flex items-center gap-1 text-warning">
                      <Trophy size={10} />
                      {post.trust.topped_exam}
                    </span>
                  )}
                  {(post.tip_count || 0) > 0 && (
                    <span className="flex items-center gap-1 text-m-red">
                      <Heart size={10} />
                      {post.tip_count}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-muted" />
                </div>
              </div>

              {post.topic_tags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {post.topic_tags.slice(0, 3).map((t) => (
                    <span key={t} className="chip text-[10px]">{t}</span>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Oracle FAB */}
      <button
        onClick={() => navigate("/oracle")}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center bg-m-blue text-ink shadow-xl shadow-m-blue/20 transition-transform hover:scale-105 active:scale-95"
        aria-label="Campus Oracle"
      >
        <Sparkles size={24} />
      </button>
    </div>
  );
}
