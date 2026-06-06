import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, GraduationCap, BookOpen, Hash } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const IDENTITIES = [
  { id: "u_aarav", name: "Aarav Mehta", role: "senior", branch: "CSE", year: "4", interests: ["Placements", "DSA", "System Design", "Web Dev", "Interview Prep", "Backend"], avatar: "🦉" },
  { id: "u_diya", name: "Diya Sharma", role: "student", branch: "ECE", year: "1", interests: ["Hackathons", "Cultural", "Sports", "Coding Club", "Robotics", "Music"], avatar: "🦋" },
  { id: "u_rohan", name: "Rohan Verma", role: "alumni", branch: "CSE", year: "alum", interests: ["Backend", "System Design", "Placements", "Startups"], avatar: "🚀" },
  { id: "u_neha", name: "Neha Iyer", role: "senior", branch: "CSE", year: "4", interests: ["DSA", "ML/AI", "Placements", "Research"], avatar: "🧠" },
  { id: "u_kabir", name: "Kabir Singh", role: "student", branch: "Mechanical", year: "3", interests: ["GATE", "Core Mechanical", "Thermodynamics", "Robotics"], avatar: "⚙️" },
  { id: "u_ananya", name: "Ananya Rao", role: "student", branch: "CSE", year: "3", interests: ["Web Dev", "Design", "Hackathons", "Frontend", "Placements"], avatar: "🎨" },
  { id: "u_vikram", name: "Vikram Nair", role: "student", branch: "CSE", year: "4", interests: ["DSA", "Backend", "Placements", "Competitive Programming"], avatar: "🏆" },
  { id: "u_sara", name: "Sara Khan", role: "student", branch: "ECE", year: "2", interests: ["Cultural", "Music", "Design", "Photography"], avatar: "🎭" },
  { id: "u_arjun", name: "Arjun Patel", role: "student", branch: "CSE", year: "3", interests: ["System Design", "Backend", "Web Dev", "Placements", "Hackathons"], avatar: "💻" },
  { id: "u_ishita", name: "Ishita Gupta", role: "student", branch: "IT", year: "4", interests: ["DSA", "Web Dev", "Placements", "Interview Prep", "Frontend"], avatar: "⭐" },
  { id: "u_dev", name: "Dev Malhotra", role: "student", branch: "CSE", year: "2", interests: ["Coding Club", "Hackathons", "Web Dev", "Sports"], avatar: "🎮" },
  { id: "u_priya", name: "Priya Menon", role: "senior", branch: "Chemical", year: "4", interests: ["GATE", "Core", "Research", "Placements"], avatar: "🔬" },
  { id: "u_tanvi", name: "Tanvi Joshi", role: "student", branch: "CSE", year: "1", interests: ["Hackathons", "Coding Club", "Sports", "Cultural"], avatar: "🌱" },
];

const INTEREST_CHIPS = [
  "Placements", "DSA", "System Design", "Web Dev", "Interview Prep", "Backend",
  "Frontend", "ML/AI", "GATE", "Core Mechanical", "Hackathons", "Cultural",
  "Sports", "Coding Club", "Robotics", "Music", "Design", "Photography",
  "Competitive Programming", "CN", "DBMS", "OS", "Thermodynamics",
  "Aptitude", "Research", "Startups", "Core", "Exams", "Announcements",
];

export default function Onboarding() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"identity" | "profile" | "interests">("identity");
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("3");
  const [pickedInterests, setPickedInterests] = useState<string[]>([]);
  const [error, setError] = useState("");

  const identity = IDENTITIES.find((i) => i.id === selectedId);

  const handleIdentity = async (id: string) => {
    setSelectedId(id);
    const i = IDENTITIES.find((x) => x.id === id)!;
    setBranch(i.branch);
    setYear(i.year);
    setPickedInterests([...i.interests]);
    setStep("profile");
  };

  const toggleInterest = (tag: string) => {
    setPickedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const finish = async () => {
    if (!identity) return;
    setLoading(true);
    setError("");
    try {
      await login(identity.id);
      // Update interests on server if changed
      if (pickedInterests.length) {
        await api.updateInterests(pickedInterests);
      }
      navigate("/feed", { replace: true });
    } catch (e) {
      setError((e as Error).message || "Could not connect to campus server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-safe flex-col bg-canvas px-5 pt-safe">
      <div className="mt-8 mb-6">
        <div className="m-stripe mb-4 h-1 w-12" />
        <h1 className="font-display text-3xl uppercase tracking-tight">Quad</h1>
        <p className="mt-2 text-sm text-muted">The campus stops forgetting.</p>
      </div>

      {step === "identity" && (
        <div className="flex-1">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted">Pick your identity</p>
          <div className="grid grid-cols-1 gap-2">
            {IDENTITIES.map((i) => (
              <button
                key={i.id}
                onClick={() => handleIdentity(i.id)}
                className="flex items-center gap-3 rounded-none border border-hairline bg-surface px-4 py-3 text-left transition-colors hover:border-ink"
              >
                <span className="text-xl">{i.avatar}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink">{i.name}</div>
                  <div className="text-xs text-muted">{i.branch} · Year {i.year} · {i.role}</div>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "profile" && identity && (
        <div className="flex-1">
          <button onClick={() => setStep("identity")} className="mb-4 text-xs text-muted underline">
            ← Back to identities
          </button>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl">{identity.avatar}</span>
            <div>
              <div className="text-base font-medium">{identity.name}</div>
              <div className="text-xs text-muted">{identity.branch} · Year {identity.year}</div>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
              <BookOpen size={14} /> Branch
            </label>
            <select
              className="input"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              {["CSE", "IT", "ECE", "Mechanical", "Chemical", "Civil", "Biotech"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
              <GraduationCap size={14} /> Year
            </label>
            <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
              {["1", "2", "3", "4"].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-fill w-full" onClick={() => setStep("interests")}>
            Next: interests
          </button>
        </div>
      )}

      {step === "interests" && (
        <div className="flex-1">
          <button onClick={() => setStep("profile")} className="mb-4 text-xs text-muted underline">
            ← Back
          </button>
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
            <Hash size={14} /> Select your interests
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {INTEREST_CHIPS.map((tag) => {
              const on = pickedInterests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`chip ${on ? "chip-on" : ""}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <button className="btn btn-fill w-full" onClick={finish} disabled={loading}>
            {loading ? "Entering campus…" : "Enter Quad"}
          </button>
          {error && (
            <div className="mt-3 border-l-2 border-m-red bg-m-red/10 px-3 py-2 text-[11px] text-m-red">
              {error.includes("Failed to fetch") || error.includes("NetworkError")
                ? "Cannot reach campus server. Make sure your laptop and phone are on the same Wi-Fi, and VITE_API_URL is set to your laptop's IP (e.g., http://192.168.1.x:4000)."
                : error}
            </div>
          )}
        </div>
      )}

      <div className="pb-safe pt-6 text-center text-[10px] text-muted">
        CampusOS · iQOO Hackathon 2026
      </div>
    </div>
  );
}
