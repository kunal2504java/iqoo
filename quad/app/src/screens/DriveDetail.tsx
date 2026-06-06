import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, Award, ChevronRight } from "lucide-react";
import { api } from "../api";
import type { Post, User } from "../api";

export default function DriveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drive, setDrive] = useState<Post | null>(null);
  const [candidates, setCandidates] = useState<(User & { match_reason?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.driveDetail(id),
      api.driveCandidates(id).then((r) => { setCandidates(r.candidates); return r.drive; }),
    ])
      .then(([d]) => setDrive(d))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-safe bg-canvas px-4 pt-safe">
        <div className="py-10 text-center text-sm text-muted">Loading…</div>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="min-h-safe bg-canvas px-4 pt-safe">
        <div className="py-10 text-center text-sm text-muted">Drive not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-safe bg-canvas">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-canvas/95 px-4 pt-safe pb-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 truncate text-sm font-medium">Drive Details</div>
      </div>

      <div className="px-4 pb-8">
        <div className="mt-4 border border-hairline bg-surface p-4">
          <div className="mb-2 flex items-center gap-2 text-m-blue">
            <Briefcase size={16} />
            <span className="text-[10px] uppercase tracking-wider">Campus Drive</span>
          </div>
          <h2 className="text-lg font-medium text-ink">{drive.title}</h2>
          <p className="mt-1 text-xs text-muted">{drive.description}</p>

          {drive.drive && (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-4 text-xs">
              <div>
                <div className="text-muted">Role</div>
                <div className="text-ink font-medium">{drive.drive.role}</div>
              </div>
              <div>
                <div className="text-muted">CTC</div>
                <div className="text-ink font-medium">{drive.drive.ctc}</div>
              </div>
              <div>
                <div className="text-muted">Eligibility</div>
                <div className="text-ink font-medium">{drive.drive.eligibility}</div>
              </div>
              <div>
                <div className="text-muted">Deadline</div>
                <div className="text-ink font-medium">{drive.drive.deadline}</div>
              </div>
            </div>
          )}
        </div>

        {/* Reverse Discovery */}
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <Award size={14} /> Reverse Discovery — Matching Students
          </h3>
          <div className="space-y-2">
            {candidates.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-center gap-3 border border-hairline bg-surface p-3"
              >
                <span className="text-xl">{c.avatar || "👤"}</span>
                <div className="flex-1">
                  <div className="text-sm text-ink">{c.name}</div>
                  <div className="text-[11px] text-muted">{c.branch} · Year {c.year} · {c.role}</div>
                  {c.match_reason && (
                    <div className="mt-0.5 text-[10px] text-m-blue">{c.match_reason}</div>
                  )}
                </div>
                <ChevronRight size={16} className="text-muted" />
              </motion.div>
            ))}
            {candidates.length === 0 && (
              <div className="text-xs text-muted">No strong matches yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
