import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Hash, LogOut, Crown, Coins, Trophy, Medal, Award } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import type { User } from "../api";

const INTEREST_CHIPS = [
  "Placements", "DSA", "System Design", "Web Dev", "Interview Prep", "Backend",
  "Frontend", "ML/AI", "GATE", "Core Mechanical", "Hackathons", "Cultural",
  "Sports", "Coding Club", "Robotics", "Music", "Design", "Photography",
  "Competitive Programming", "CN", "DBMS", "OS", "Thermodynamics",
  "Aptitude", "Research", "Startups", "Core", "Exams", "Announcements",
];

const RANK_ICON = [Trophy, Medal, Award, Award, Award];
const RANK_COLOR = ["text-m-red", "text-warning", "text-m-blue", "text-body", "text-body"];

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<string[]>(user?.interests || []);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard()
      .then((r) => setLeaderboard(r.users))
      .finally(() => setLbLoading(false));
  }, []);

  const toggle = (tag: string) => {
    setPicked((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.updateInterests(picked);
      setUser(updated);
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = user?.role === "senior" ? "Senior" : user?.role === "alumni" ? "Alumni" : user?.role === "admin" ? "Admin" : "Student";
  const roleColor = user?.role === "senior" ? "text-warning border-warning/40 bg-warning/10" : user?.role === "alumni" ? "text-purple-400 border-purple-400/40 bg-purple-400/10" : user?.role === "admin" ? "text-m-red border-m-red/40 bg-m-red/10" : "text-body border-hairline";

  return (
    <div className="min-h-safe bg-canvas px-4 pt-safe pb-8">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-canvas/95 pt-3 pb-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        <div className="text-sm font-medium">Profile</div>
      </div>

      {user && (
        <div className="mt-6">
          {/* Identity card */}
          <div className="border border-hairline bg-surface p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center border border-hairline bg-canvas text-3xl">
                {user.avatar || "👤"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-medium">{user.name}</div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 text-[9px] machined border ${roleColor}`}>
                    <Crown size={9} />
                    {roleLabel}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">{user.branch} · Year {user.year}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm text-m-blue">
                    <Coins size={14} />
                    <span className="font-semibold">{user.points}</span>
                    <span className="text-[10px] text-muted">Quad Points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
              <Trophy size={14} /> Top Contributors
            </div>
            {lbLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-surface border border-hairline" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((u, idx) => {
                  const RankIcon = RANK_ICON[idx] || Award;
                  const isMe = u.id === user.id;
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-3 border p-3 ${isMe ? "border-m-blue bg-m-blue/10" : "border-hairline bg-surface"}`}
                    >
                      <div className={`flex h-7 w-7 items-center justify-center text-[11px] font-bold ${RANK_COLOR[idx] || "text-muted"}`}>
                        <RankIcon size={16} />
                      </div>
                      <span className="text-base">{u.avatar || "👤"}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-ink">{u.name} {isMe && <span className="text-m-blue">(you)</span>}</div>
                        <div className="text-[10px] text-muted">{u.branch} · {u.role}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-m-blue">
                        <Coins size={10} />
                        {u.points}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="mt-6">
            <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
              <Hash size={14} /> Your interests — feed adapts to these
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_CHIPS.map((tag) => {
                const on = picked.includes(tag);
                return (
                  <button key={tag} onClick={() => toggle(tag)} className={`chip ${on ? "chip-on" : ""}`}>
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button className="btn btn-fill flex-1" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save interests"}
            </button>
            <button className="btn btn-ghost flex-1 gap-2" onClick={logout}>
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
