import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, MapPin, Users, Zap, Calendar,
  Radio, Star,
} from "lucide-react";
import type { Post } from "../api";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const ROLE_BORDER: Record<string, string> = {
  student: "border-gray-400",
  senior: "border-yellow-400",
  alumni: "border-purple-400",
  admin: "border-red-400",
};

const QUICK_REACTIONS = ["🔥", "❤️", "🎉", "👏", "🚀", "⭐"];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

function getUrgency(startTime: string): { label: string; color: string; border: string; pulse: boolean } {
  const diffMs = new Date(startTime).getTime() - Date.now();
  const diffMin = diffMs / 60_000;
  const diffHours = diffMs / 3600_000;

  if (diffMin < 0 && diffMin > -180) {
    return { label: "LIVE NOW", color: "text-m-red", border: "border-m-red", pulse: true };
  }
  if (diffHours <= 2) {
    return { label: "STARTING SOON", color: "text-orange-400", border: "border-orange-400", pulse: true };
  }
  if (diffHours <= 8) {
    return { label: "TONIGHT", color: "text-m-blue", border: "border-m-blue", pulse: false };
  }
  if (diffHours <= 24) {
    return { label: "TOMORROW", color: "text-muted", border: "border-muted", pulse: false };
  }
  return { label: "UPCOMING", color: "text-muted", border: "border-hairline", pulse: false };
}

function formatCountdown(startTime: string): string {
  const diffMs = new Date(startTime).getTime() - Date.now();
  if (diffMs < 0) {
    const minsAgo = Math.abs(Math.round(diffMs / 60_000));
    if (minsAgo < 60) return `Started ${minsAgo}m ago`;
    return `Started ${Math.floor(minsAgo / 60)}h ago`;
  }
  const hours = Math.floor(diffMs / 3600_000);
  const mins = Math.floor((diffMs % 3600_000) / 60_000);
  const secs = Math.floor((diffMs % 60_000) / 1000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m ${secs}s`;
}

function eventSection(startTime: string): string {
  const u = getUrgency(startTime);
  return u.label;
}

export default function EventsFeed() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setTick] = useState(0);
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const [rsvpd, setRsvpd] = useState<Set<string>>(new Set());
  const [reactionCounts, setReactionCounts] = useState<Record<string, Record<string, number>>>({});

  // Tick countdown every second
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.liveEvents();
      setEvents(data.events);
      // Track which events user has RSVP'd to
      const rsvpSet = new Set<string>();
      data.events.forEach((ev) => {
        if (ev.event?.rsvp_users?.includes(user?.id || "")) rsvpSet.add(ev.id);
        if (ev.reactions) setReactionCounts((prev) => ({ ...prev, [ev.id]: ev.reactions! }));
      });
      setRsvpd(rsvpSet);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendReaction = (eventId: string, emoji: string, x: number) => {
    const id = `${Date.now()}_${Math.random()}`;
    setFloating((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), 2000);
    // Optimistic update
    setReactionCounts((prev) => {
      const next = { ...prev };
      if (!next[eventId]) next[eventId] = {};
      next[eventId][emoji] = (next[eventId][emoji] || 0) + 1;
      return next;
    });
    api.reactEvent(eventId, emoji).catch(() => {});
  };

  const doRsvp = async (eventId: string) => {
    try {
      const res = await api.rsvpEvent(eventId);
      setRsvpd((prev) => new Set(prev).add(eventId));
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId && ev.event
            ? { ...ev, event: { ...ev.event, rsvp_count: res.rsvp_count, rsvp_users: res.rsvp_users } }
            : ev
        )
      );
    } catch {}
  };

  const grouped = events.reduce<Record<string, Post[]>>((acc, ev) => {
    const sec = eventSection(ev.event!.start_time);
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(ev);
    return acc;
  }, {});

  const sectionOrder = ["LIVE NOW", "STARTING SOON", "TONIGHT", "TOMORROW", "UPCOMING"];
  const sectionIcons: Record<string, React.ReactNode> = {
    "LIVE NOW": <Radio size={14} className="text-m-red" />,
    "STARTING SOON": <Clock size={14} className="text-orange-400" />,
    "TONIGHT": <Star size={14} className="text-m-blue" />,
    "TOMORROW": <Calendar size={14} className="text-muted" />,
    "UPCOMING": <Calendar size={14} className="text-muted" />,
  };

  return (
    <div className="min-h-safe bg-canvas">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl uppercase tracking-tight">Campus Live</h1>
            <p className="mt-0.5 text-[11px] text-muted">What&apos;s happening right now</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <Zap size={12} className="text-m-red animate-pulse" />
            <span>{events.length} events</span>
          </div>
        </div>
      </div>

      {/* Stories Ring */}
      {!loading && events.length > 0 && (
        <div className="mb-4 mt-2 px-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {events.slice(0, 8).map((ev) => {
              const u = getUrgency(ev.event!.start_time);
              const isLive = u.label === "LIVE NOW";
              return (
                <button
                  key={ev.id}
                  onClick={() => {
                    const el = document.getElementById(`event-${ev.id}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                >
                  <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 ${isLive ? "border-m-red animate-pulse" : u.border} bg-surface`}>
                    <span className="text-xl">{ev.author?.avatar || "👤"}</span>
                    {isLive && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-m-red text-[8px] text-ink font-bold">
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-muted truncate max-w-[56px]">{ev.title.slice(0, 12)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating reactions layer */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <AnimatePresence>
          {floating.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: 0, x: f.x, scale: 1 }}
              animate={{ opacity: 0, y: -300, x: f.x + (Math.random() - 0.5) * 40, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute bottom-20 text-2xl"
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Feed */}
      <div className="px-4 pb-24 space-y-6">
        {loading && (
          <div className="space-y-4 py-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse bg-surface border border-hairline rounded-lg" />
            ))}
          </div>
        )}

        {error && <div className="py-10 text-center text-sm text-m-red">{error}</div>}

        {sectionOrder.map((section) => {
          const secEvents = grouped[section];
          if (!secEvents || secEvents.length === 0) return null;
          return (
            <div key={section}>
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                {sectionIcons[section]}
                <span className={section === "LIVE NOW" ? "text-m-red" : section === "STARTING SOON" ? "text-orange-400" : "text-muted"}>
                  {section}
                </span>
                <div className="flex-1 h-px bg-hairline" />
              </div>
              <div className="space-y-3">
                {secEvents.map((ev, idx) => {
                  const u = getUrgency(ev.event!.start_time);
                  const countdown = formatCountdown(ev.event!.start_time);
                  const hasRsvpd = rsvpd.has(ev.id);
                  const reactions = reactionCounts[ev.id] || {};
                  const topReactions = Object.entries(reactions).sort((a, b) => b[1] - a[1]).slice(0, 3);

                  return (
                    <motion.div
                      id={`event-${ev.id}`}
                      key={ev.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`relative overflow-hidden border border-hairline bg-surface transition-colors hover:border-ink`}
                    >
                      {/* Urgency stripe */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${u.border.replace("border-", "bg-")}`} />

                      {/* Top meta */}
                      <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] machined px-2 py-0.5 border ${u.border} ${u.color}`}>
                            {u.label}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted">
                            <Clock size={10} />
                            {countdown}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted">
                          <MapPin size={10} />
                          {ev.event?.venue}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-4 pb-3">
                        <h3 className="text-sm font-medium text-ink leading-snug">{ev.title}</h3>
                        <p className="mt-1 text-xs text-muted line-clamp-2">{ev.description}</p>
                      </div>

                      {/* Reactions bar */}
                      <div className="flex items-center gap-1 px-4 pb-3">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              const rect = (e.target as HTMLElement).getBoundingClientRect();
                              sendReaction(ev.id, emoji, rect.left + rect.width / 2);
                            }}
                            className="flex h-8 w-8 items-center justify-center text-base rounded-full hover:bg-canvas transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                        {topReactions.length > 0 && (
                          <div className="ml-auto flex items-center gap-2 text-[10px] text-muted">
                            {topReactions.map(([emoji, count]) => (
                              <span key={emoji} className="flex items-center gap-0.5">
                                {emoji} {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* RSVP row */}
                      <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {(ev.event?.rsvp_users || []).slice(0, 4).map((uid: string, i: number) => {
                              const u = events.find((e) => e.author?.id === uid)?.author || { avatar: "👤", role: "student" };
                              return (
                                <div
                                  key={i}
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border border-canvas text-[10px] ${ROLE_BORDER[u.role] || "border-gray-400"} bg-surface`}
                                >
                                  {u.avatar || "👤"}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[10px] text-muted">
                            {ev.event?.rsvp_count || 0} going
                          </span>
                        </div>
                        <button
                          onClick={() => doRsvp(ev.id)}
                          disabled={hasRsvpd}
                          className={`flex items-center gap-1 px-3 py-1.5 text-[10px] machined transition-colors ${
                            hasRsvpd
                              ? "bg-success/15 text-success border border-success/40"
                              : "bg-m-blue/15 text-m-blue border border-m-blue/40 hover:bg-m-blue/25"
                          }`}
                        >
                          {hasRsvpd ? (
                            <>
                              <Users size={10} /> GOING
                            </>
                          ) : (
                            <>
                              <Users size={10} /> RSVP
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {events.length === 0 && !loading && (
          <div className="py-20 text-center text-sm text-muted">
            No events on campus right now. Start one!
          </div>
        )}
      </div>
    </div>
  );
}
