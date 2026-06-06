import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Briefcase, CalendarDays, ShieldCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";
import type { Post } from "../api";

const PROFILE_A = "u_aarav";
const PROFILE_B = "u_diya";

export default function TwoCampus() {
  const navigate = useNavigate();
  const [feedA, setFeedA] = useState<Post[]>([]);
  const [feedB, setFeedB] = useState<Post[]>([]);
  const [, setStatsA] = useState<{ notes: number; drives: number; enrichments: number } | null>(null);
  const [, setStatsB] = useState<{ notes: number; drives: number; enrichments: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [a, b] = await Promise.all([
          fetch(`${API_BASE}/feed`, { headers: { "x-user-id": PROFILE_A } }).then((r) => r.json()),
          fetch(`${API_BASE}/feed`, { headers: { "x-user-id": PROFILE_B } }).then((r) => r.json()),
        ]);
        setFeedA(a.items.slice(0, 6));
        setFeedB(b.items.slice(0, 6));
        setStatsA(a.stats);
        setStatsB(b.stats);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-safe bg-canvas px-4 pt-safe">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-canvas/95 pt-3 pb-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-sm uppercase">Two Campuses</h1>
          <p className="text-[10px] text-muted">Same memory, different students</p>
        </div>
      </div>

      {loading && (
        <div className="py-10 text-center text-sm text-muted">Loading both feeds…</div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 pb-8">
        {/* Profile A */}
        <div className="border border-hairline bg-surface">
          <div className="border-b border-hairline bg-canvas p-2">
            <div className="text-center text-xs font-medium text-m-blue">Aarav — Final Year CSE</div>
            <div className="mt-1 flex items-center justify-center gap-2 text-[9px] text-muted">
              <Zap size={10} /> Placements · DSA · System Design
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-2 space-y-2">
            {feedA.map((post, idx) => (
              <PhoneCard key={post.id} post={post} idx={idx} />
            ))}
          </div>
        </div>

        {/* Profile B */}
        <div className="border border-hairline bg-surface">
          <div className="border-b border-hairline bg-canvas p-2">
            <div className="text-center text-xs font-medium text-m-red">Diya — Fresher ECE</div>
            <div className="mt-1 flex items-center justify-center gap-2 text-[9px] text-muted">
              <Zap size={10} /> Hackathons · Cultural · Sports
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-2 space-y-2">
            {feedB.map((post, idx) => (
              <PhoneCard key={post.id} post={post} idx={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneCard({ post, idx }: { post: Post; idx: number }) {
  const Icon = post.type === "note" ? FileText : post.type === "drive" ? Briefcase : post.type === "event" ? CalendarDays : FileText;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="border border-hairline bg-canvas p-2"
    >
      <div className="mb-1 flex items-center gap-1 text-[9px] text-muted">
        <Icon size={10} className="text-m-blue" />
        <span className="uppercase tracking-wider">{post.type}</span>
        {post.matched && <span className="ml-auto text-m-blue">{post.match_reason}</span>}
      </div>
      <div className="text-[11px] font-medium leading-snug text-ink line-clamp-2">{post.title}</div>
      <div className="mt-1 flex items-center gap-1 text-[9px] text-muted">
        <ShieldCheck size={9} className="text-success" />
        <span>{post.trust.verified_by}</span>
      </div>
    </motion.div>
  );
}
