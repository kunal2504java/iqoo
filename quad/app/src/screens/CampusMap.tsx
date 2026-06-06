import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Map as MapIcon, Navigation, Users, Crosshair, Send, Zap } from "lucide-react";
import { api, imageUrl } from "../api";
import type { User } from "../api";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// Campus center (IIT Delhi area — real coordinates)
const CAMPUS_CENTER = { lat: 28.5459, lng: 77.1926 };

interface ZoneMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  recent: number;
}

// Role colors for avatar borders
const ROLE_BORDER: Record<string, string> = {
  student: "#bbbbbb",
  senior: "#f4b400",
  alumni: "#a855f7",
  admin: "#e22718",
};

let mapsLoadPromise: Promise<any> | null = null;

function loadGoogleMaps(): Promise<any> {
  if (mapsLoadPromise) return mapsLoadPromise;
  if (window.google?.maps) return Promise.resolve(window.google);
  if (!GOOGLE_MAPS_KEY) return Promise.reject(new Error("No Google Maps API key"));

  mapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

export default function CampusMap() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<ZoneMarker[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [nudgePanel, setNudgePanel] = useState(false);
  const [nudgeText, setNudgeText] = useState("");
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeSent, setNudgeSent] = useState(false);
  const [voices, setVoices] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Ask for location permission
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Permission denied or unavailable — use campus center as "my location"
          setMyLocation(CAMPUS_CENTER);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setMyLocation(CAMPUS_CENTER);
    }
  }, []);

  // Load data
  useEffect(() => {
    Promise.all([api.getMap(), api.getActiveUsers(), api.getVoices()])
      .then(([mapData, userData, voiceData]) => {
        setZones(mapData.zones.map((z) => ({ ...z, lat: CAMPUS_CENTER.lat + (Math.random() - 0.5) * 0.004, lng: CAMPUS_CENTER.lng + (Math.random() - 0.5) * 0.004 })));
        setActiveUsers(userData.users);
        setVoices(voiceData.voices);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const playVoice = (url: string) => {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // voice_url is a backend-relative path (/uploads/..); make it absolute so it
    // resolves to the API server, not the app origin (localhost:5173 / capacitor://).
    const a = new Audio(imageUrl(url));
    a.play().catch((e) => console.warn("voice playback failed:", e));
    audioRef.current = a;
    a.onended = () => { audioRef.current = null; };
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !myLocation) return;

    loadGoogleMaps()
      .then((google) => {
        const map = new google.maps.Map(mapRef.current!, {
          center: CAMPUS_CENTER,
          zoom: 17,
          mapId: "QUAD_CAMPUS_MAP",
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        googleMapRef.current = map;

        // Dark theme map styles
        map.setOptions({
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
            { elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#7e7e7e" }] },
            { featureType: "administrative.locality", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#2b2b2b" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8A8F98" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0d0d" }] },
            { featureType: "landscape.man_made", stylers: [{ color: "#1a1a1a" }] },
            { featureType: "landscape.natural", stylers: [{ color: "#1a1a1a" }] },
          ],
        });

        // My location marker
        new google.maps.marker.AdvancedMarkerElement({
          map,
          position: myLocation,
          title: "You",
          content: buildPinElement("📍", "#1c69d4", 28),
        });

        // Zone markers
        zones.forEach((zone) => {
          const intensity = zone.count / Math.max(...zones.map((z) => z.count), 1);
          const color = intensity > 0.6 ? "#e22718" : intensity > 0.3 ? "#1c69d4" : "#3c3c3c";
          const el = document.createElement("div");
          el.className = "flex flex-col items-center";
          el.innerHTML = `
            <div style="
              width: ${20 + intensity * 20}px; height: ${20 + intensity * 20}px;
              background: ${color}; border-radius: 50%;
              border: 2px solid #000; box-shadow: 0 0 12px ${color}80;
              display: flex; align-items: center; justify-content: center;
              font-size: 10px; color: #fff; font-weight: bold;
            ">${zone.count}</div>
            <div style="margin-top: 4px; background: #000; color: #bbb; font-size: 9px; padding: 2px 6px; border: 1px solid #3c3c3c; white-space: nowrap;">${zone.name}</div>
          `;
          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: zone.lat, lng: zone.lng },
            title: zone.name,
            content: el,
          });
          marker.addListener("click", () => {
            setSelectedUser(null);
          });
          markersRef.current.push(marker);
        });

        // Active user markers with avatars
        activeUsers.forEach((u) => {
          const borderColor = ROLE_BORDER[u.role] || "#bbbbbb";
          const el = document.createElement("div");
          el.className = "cursor-pointer transition-transform hover:scale-110";
          el.innerHTML = `
            <div style="
              width: 36px; height: 36px; border-radius: 50%;
              border: 3px solid ${borderColor};
              background: #000; display: flex; align-items: center; justify-content: center;
              font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            ">${u.avatar || "👤"}</div>
            <div style="
              position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%);
              background: #000; border: 1px solid ${borderColor}; color: #bbb;
              font-size: 8px; padding: 1px 4px; white-space: nowrap;
            ">${u.name.split(" ")[0]}</div>
          `;
          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: u.lat, lng: u.lng },
            title: `${u.name} (${u.role})`,
            content: el,
          });
          marker.addListener("click", () => {
            setSelectedUser(u);
          });
          markersRef.current.push(marker);
        });

        // Voice note markers — glowing red recording dots
        voices.forEach((v) => {
          if (!v.lat || !v.lng) return;
          const genderIcon = v.voice_gender === "male" ? "👨" : v.voice_gender === "female" ? "👩" : "";
          const el = document.createElement("div");
          el.className = "cursor-pointer";
          el.innerHTML = `
            <div style="
              width: 32px; height: 32px; border-radius: 50%;
              background: #e22718; border: 3px solid #000;
              display: flex; align-items: center; justify-content: center;
              font-size: 14px; box-shadow: 0 0 12px #e2271880;
              animation: pulse-red 1.6s ease-in-out infinite; position: relative;
            ">🎙️${genderIcon ? `<span style="
              position: absolute; top: -6px; right: -6px;
              background: #000; border: 1px solid #e22718; border-radius: 50%;
              width: 16px; height: 16px; display: flex; align-items: center;
              justify-content: center; font-size: 9px;
            ">${genderIcon}</span>` : ""}</div>
            <div style="
              position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%);
              background: #000; border: 1px solid #e22718; color: #bbb;
              font-size: 7px; padding: 1px 3px; white-space: nowrap;
            ">${v.voice_gender ? v.voice_gender.charAt(0).toUpperCase() + v.voice_gender.slice(1) + " voice" : "Voice"}</div>
          `;
          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: v.lat, lng: v.lng },
            title: v.description || "Voice note",
            content: el,
          });
          marker.addListener("click", () => {
            if (v.voice_url) playVoice(v.voice_url);
          });
          markersRef.current.push(marker);
        });
      })
      .catch((e) => {
        console.error("[map] Google Maps load failed:", e);
        setError("Google Maps failed to load. Check your API key.");
      });
  }, [myLocation, zones, activeUsers]);

  // Fly to my location
  const goToMe = () => {
    if (googleMapRef.current && myLocation) {
      googleMapRef.current.panTo(myLocation);
      googleMapRef.current.setZoom(18);
    }
  };

  // Fly to campus center
  const goToCampus = () => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo(CAMPUS_CENTER);
      googleMapRef.current.setZoom(17);
    }
  };

  return (
    <div className="flex min-h-safe flex-col bg-canvas">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-canvas/95 px-4 pt-safe pb-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <MapIcon size={18} className="text-m-blue" />
          <div>
            <h1 className="font-display text-sm uppercase">Campus Pulse</h1>
            <p className="text-[10px] text-muted">Real campus. Real people. Right now.</p>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-canvas">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-m-blue border-t-transparent mx-auto" />
              <div className="text-xs text-muted">Loading campus map…</div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-canvas">
            <div className="text-center text-sm text-m-red">{error}</div>
          </div>
        )}

        <div ref={mapRef} className="h-[60vh] w-full" />

        {/* Map controls */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <button onClick={goToMe} className="flex h-10 w-10 items-center justify-center bg-canvas border border-hairline text-ink shadow-lg hover:border-m-blue">
            <Crosshair size={18} />
          </button>
          <button onClick={goToCampus} className="flex h-10 w-10 items-center justify-center bg-canvas border border-hairline text-ink shadow-lg hover:border-m-blue">
            <Navigation size={18} />
          </button>
        </div>

        {/* Selected user card + Nudge panel */}
        {selectedUser && !nudgePanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-16 z-10 border border-hairline bg-surface p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg" style={{ borderColor: ROLE_BORDER[selectedUser.role] || "#bbb" }}>
                {selectedUser.avatar || "👤"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink">{selectedUser.name}</div>
                <div className="text-[10px] text-muted">{selectedUser.branch} · {selectedUser.role} · {selectedUser.points} pts</div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-muted hover:text-ink text-xs">✕</button>
            </div>
            <button
              onClick={() => { setNudgePanel(true); setNudgeSent(false); setNudgeText(""); }}
              className="btn btn-blue mt-2 w-full text-[11px] h-9"
            >
              <Zap size={12} /> Poke / Nudge
            </button>
          </motion.div>
        )}

        {/* Nudge panel — short casual message */}
        {selectedUser && nudgePanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 z-10 border border-hairline bg-surface p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted machined">Say hi to {selectedUser.name.split(" ")[0]}</span>
              <button onClick={() => setNudgePanel(false)} className="text-muted hover:text-ink text-xs">✕</button>
            </div>

            {!nudgeSent ? (
              <>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {["Poke 👋", "Hey!", "Up for chai? ☕", "Seen you around!"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setNudgeText(preset)}
                      className={`chip text-[10px] ${nudgeText === preset ? "chip-on" : ""}`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={nudgeText}
                    onChange={(e) => setNudgeText(e.target.value.slice(0, 60))}
                    placeholder="Or type something chill…"
                    className="input flex-1 h-9 text-xs px-3"
                  />
                  <button
                    onClick={async () => {
                      if (!nudgeText.trim()) return;
                      setNudgeLoading(true);
                      try {
                        await api.nudgeUser(selectedUser.id, nudgeText.trim());
                        setNudgeSent(true);
                      } catch (e) {
                        alert((e as Error).message);
                      } finally {
                        setNudgeLoading(false);
                      }
                    }}
                    disabled={nudgeLoading || !nudgeText.trim()}
                    className="btn btn-fill px-3 h-9"
                  >
                    <Send size={12} />
                  </button>
                </div>
                <div className="mt-1 text-[9px] text-muted text-right">{nudgeText.length}/60</div>
              </>
            ) : (
              <div className="py-2 text-center text-sm text-m-blue">
                Nudge sent to {selectedUser.name.split(" ")[0]}! 🚀
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Active users strip */}
      <div className="border-t border-hairline bg-canvas px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
          <Users size={12} />
          <span>Active on campus ({activeUsers.length})</span>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {activeUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSelectedUser(u);
                if (googleMapRef.current) {
                  googleMapRef.current.panTo({ lat: u.lat, lng: u.lng });
                  googleMapRef.current.setZoom(19);
                }
              }}
              className="flex shrink-0 flex-col items-center gap-1"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg"
                style={{ borderColor: ROLE_BORDER[u.role] || "#bbb" }}
              >
                {u.avatar || "👤"}
              </div>
              <span className="text-[9px] text-muted whitespace-nowrap">{u.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-hairline bg-canvas px-4 py-2">
        <div className="flex items-center gap-4 text-[10px] text-muted">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-m-red" />
            <span>High activity zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-m-blue" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full border border-hairline" />
            <span>Student</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPinElement(emoji: string, color: string, size: number): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: ${size}px; height: ${size}px; border-radius: 50%;
    background: ${color}; border: 2px solid #000;
    display: flex; align-items: center; justify-content: center;
    font-size: ${size * 0.5}px; box-shadow: 0 0 10px ${color}60;
  `;
  el.textContent = emoji;
  return el;
}
