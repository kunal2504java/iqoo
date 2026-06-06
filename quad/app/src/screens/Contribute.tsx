import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, ImagePlus, Briefcase, Type, Check, RotateCcw, Layers, Lightbulb, BookOpen, ExternalLink, Zap, Mic } from "lucide-react";
import CameraCapture from "../components/CameraCapture";
import type { CapturedImage } from "../hooks/useCamera";
import { api, imageUrl } from "../api";
import type { Post } from "../api";

export default function Contribute() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"choose" | "capture" | "meta" | "enriching" | "reveal">("choose");
  const [kind, setKind] = useState<"note" | "poster" | "drive" | "text" | "voice">("note");
  const [image, setImage] = useState<CapturedImage | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [voiceText, setVoiceText] = useState("");
  // Drive-specific fields
  const [driveRole, setDriveRole] = useState("");
  const [driveCtc, setDriveCtc] = useState("");
  const [driveEligibility, setDriveEligibility] = useState("");
  const [driveDeadline, setDriveDeadline] = useState("");
  const [driveTags, setDriveTags] = useState("");
  const [result, setResult] = useState<{ post: Post; matched_count: number; stats: { notes: number; drives: number; enrichments: number } } | null>(null);
  const [error, setError] = useState("");
  const startCapture = (k: typeof kind) => {
    setKind(k);
    if (k === "text" || k === "drive" || k === "voice") {
      setStep("meta");
    } else {
      setStep("capture");
    }
  };

  const handleCapture = (img: CapturedImage) => {
    setImage(img);
    setStep("meta");
  };

  const submit = async () => {
    setError("");
    setStep("enriching");
    try {
      if (kind === "drive") {
        const res = await api.postDrive({
          role: driveRole || desc,
          ctc: driveCtc,
          eligibility: driveEligibility,
          deadline: driveDeadline,
          title: title || `${driveRole || desc} — Campus Drive`,
          tags: driveTags.split(",").map((t) => t.trim()).filter(Boolean),
        });
        setResult({ post: res.post, matched_count: res.matched_count, stats: res.stats });
      } else if (kind === "voice") {
        const res = await api.contributeVoice(voiceText);
        setResult({ post: res.post, matched_count: res.matched_count, stats: res.stats });
      } else {
        const form = new FormData();
        form.append("kind", kind);
        form.append("title", title);
        form.append("desc", desc);
        if (image?.blob) {
          form.append("image", image.blob, image.filename);
        }
        const res = await api.contribute(form);
        setResult(res);
      }
      setStep("reveal");
    } catch (e) {
      setError((e as Error).message);
      setStep("meta");
    }
  };

  return (
    <div className="min-h-safe bg-canvas px-4 pt-safe">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-canvas/95 pt-3 pb-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        <div className="text-sm font-medium">Contribute</div>
      </div>

      <AnimatePresence mode="wait">
        {step === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-3"
          >
            <p className="text-xs uppercase tracking-widest text-muted">What are you sharing?</p>
            <button onClick={() => startCapture("note")} className="flex w-full items-center gap-3 border border-hairline bg-surface p-4 text-left hover:border-ink transition-colors">
              <FileText size={20} className="text-m-blue" />
              <div>
                <div className="text-sm font-medium">Scan a note</div>
                <div className="text-xs text-muted">OCR + summary + flashcards</div>
              </div>
            </button>
            <button onClick={() => startCapture("poster")} className="flex w-full items-center gap-3 border border-hairline bg-surface p-4 text-left hover:border-ink transition-colors">
              <ImagePlus size={20} className="text-m-blue" />
              <div>
                <div className="text-sm font-medium">Snap a poster / flyer</div>
                <div className="text-xs text-muted">Event or drive</div>
              </div>
            </button>
            <button onClick={() => startCapture("drive")} className="flex w-full items-center gap-3 border border-hairline bg-surface p-4 text-left hover:border-ink transition-colors">
              <Briefcase size={20} className="text-m-blue" />
              <div>
                <div className="text-sm font-medium">Post a drive</div>
                <div className="text-xs text-muted">Structured opportunity</div>
              </div>
            </button>
            <button onClick={() => startCapture("text")} className="flex w-full items-center gap-3 border border-hairline bg-surface p-4 text-left hover:border-ink transition-colors">
              <Type size={20} className="text-m-blue" />
              <div>
                <div className="text-sm font-medium">Quick text</div>
                <div className="text-xs text-muted">Announcement or note</div>
              </div>
            </button>
            <button onClick={() => startCapture("voice")} className="flex w-full items-center gap-3 border border-hairline bg-surface p-4 text-left hover:border-ink transition-colors">
              <Mic size={20} className="text-m-red" />
              <div>
                <div className="text-sm font-medium">Voice note</div>
                <div className="text-xs text-muted">Type → RumiK TTS → pin to map</div>
              </div>
            </button>
          </motion.div>
        )}

        {step === "capture" && (
          <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
            <CameraCapture onCapture={handleCapture} onCancel={() => setStep("choose")} />
          </motion.div>
        )}

        {step === "meta" && (
          <motion.div key="meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 space-y-4">
            {image && (
              <div className="overflow-hidden border border-hairline">
                <img src={image.dataUrl} alt="Preview" className="w-full object-cover" />
              </div>
            )}
            {kind === "drive" && (
              <div className="space-y-3">
                <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input className="input" placeholder="Role (e.g. SDE-1 Backend)" value={driveRole} onChange={(e) => setDriveRole(e.target.value)} />
                <input className="input" placeholder="CTC (e.g. ₹18 LPA)" value={driveCtc} onChange={(e) => setDriveCtc(e.target.value)} />
                <input className="input" placeholder="Eligibility (e.g. CSE/IT · CGPA ≥ 7)" value={driveEligibility} onChange={(e) => setDriveEligibility(e.target.value)} />
                <input className="input" placeholder="Deadline (YYYY-MM-DD)" value={driveDeadline} onChange={(e) => setDriveDeadline(e.target.value)} />
                <input className="input" placeholder="Tags, comma separated" value={driveTags} onChange={(e) => setDriveTags(e.target.value)} />
              </div>
            )}
            {kind === "text" && (
              <div className="space-y-3">
                <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="input min-h-[80px] py-3" placeholder="What do you want to say?" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            )}
            {kind === "voice" && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted">Type what you want the voice to say</p>
                <textarea
                  className="input min-h-[80px] py-3"
                  placeholder="Hey, I'm heading to the library. Join me?"
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value.slice(0, 200))}
                  maxLength={200}
                />
                <div className="text-[10px] text-muted text-right">{voiceText.length}/200</div>
              </div>
            )}
            {(kind === "note" || kind === "poster") && (
              <div className="space-y-3">
                <input className="input" placeholder="Optional title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="input min-h-[60px] py-3" placeholder="Optional one-line description" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            )}
            {error && <div className="text-xs text-m-red">{error}</div>}
            <div className="flex gap-2">
              <button className="btn btn-ghost flex-1" onClick={() => setStep("choose")}>Cancel</button>
              <button className="btn btn-fill flex-1" onClick={submit}>
                {kind === "drive" ? "Post Drive" : kind === "text" ? "Publish" : "Enrich"}
              </button>
            </div>
          </motion.div>
        )}

        {step === "enriching" && (
          <motion.div key="enriching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-10 flex flex-col items-center gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-m-blue/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={28} className="text-m-blue animate-pulse" />
              </div>
            </div>
            <div className="text-center text-sm text-body">Campus brain is reading your scan…</div>
            <div className="w-full max-w-xs space-y-2">
              <div className="h-2 bg-surface border border-hairline overflow-hidden">
                <motion.div
                  className="h-full bg-m-blue"
                  initial={{ width: "10%" }}
                  animate={{ width: ["10%", "40%", "70%", "90%"] }}
                  transition={{ duration: 8, ease: "easeInOut" }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted">
                <span>OCR</span>
                <span>Summary</span>
                <span>Flashcards</span>
                <span>Resources</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === "reveal" && result && (
          <EnrichmentReveal
            post={result.post}
            matchedCount={result.matched_count}
            stats={result.stats}
            onDone={() => navigate("/feed")}
            onRetry={() => setStep("choose")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EnrichmentReveal({
  post,
  matchedCount,
  stats,
  onDone,
  onRetry,
}: {
  post: Post;
  matchedCount: number;
  stats: { notes: number; drives: number; enrichments: number };
  onDone: () => void;
  onRetry: () => void;
}) {
  return (
    <motion.div
      key="reveal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-4 space-y-4 pb-8"
    >
      {/* Hero image */}
      {post.image_url && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden border border-hairline"
        >
          <img src={imageUrl(post.image_url)} alt="" className="w-full object-cover" />
        </motion.div>
      )}

      {/* Stats toast */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 border border-hairline bg-surface px-3 py-2 text-[11px] text-muted"
      >
        <Check size={14} className="text-success" />
        <span>
          Published · matched to <span className="text-ink font-medium">{matchedCount}</span> students ·{" "}
          <span className="text-ink font-medium">{stats.enrichments}</span> enrichments this batch
        </span>
      </motion.div>

      {/* Summary */}
      {post.enrichment?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h4 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <BookOpen size={12} /> Summary
          </h4>
          <div className="border border-hairline bg-surface p-3 text-sm leading-relaxed text-body">
            {post.enrichment.summary}
          </div>
        </motion.div>
      )}

      {/* Key points */}
      {post.enrichment?.key_points && post.enrichment.key_points.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h4 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <Lightbulb size={12} /> Key Points
          </h4>
          <ul className="space-y-2">
            {post.enrichment.key_points.map((p, i) => (
              <li key={i} className="flex gap-2 text-xs text-body border-l-2 border-m-blue bg-surface pl-3 py-2">
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Flashcards */}
      {post.enrichment?.flashcards && post.enrichment.flashcards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <h4 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <Layers size={12} /> Flashcards ({post.enrichment.flashcards.length})
          </h4>
          <div className="space-y-2">
            {post.enrichment.flashcards.map((fc, i) => (
              <div key={i} className="border border-hairline bg-surface p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Q{i + 1}</div>
                <div className="text-sm text-ink">{fc.q}</div>
                <div className="mt-2 border-t border-hairline pt-2 text-xs text-success">{fc.a}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resources */}
      {post.enrichment?.resources && post.enrichment.resources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <h4 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <ExternalLink size={12} /> Resources
          </h4>
          <div className="space-y-2">
            {post.enrichment.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="block border border-hairline bg-surface px-3 py-2 text-xs text-m-blue hover:border-m-blue"
              >
                {r.title}
              </a>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-2 pt-4">
        <button className="btn btn-ghost flex-1" onClick={onRetry}>
          <RotateCcw size={14} /> Scan another
        </button>
        <button className="btn btn-fill flex-1" onClick={onDone}>
          Go to feed
        </button>
      </div>
    </motion.div>
  );
}
