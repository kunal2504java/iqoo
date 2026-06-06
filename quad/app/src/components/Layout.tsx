import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, PlusCircle, User, Radio, Map } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnboarding = location.pathname === "/";

  if (isOnboarding || !user) {
    return (
      <div className="mx-auto max-w-device min-h-safe bg-canvas text-ink">
        <Outlet />
      </div>
    );
  }

  const tabs = [
    { icon: Home, label: "Feed", path: "/feed" },
    { icon: Map, label: "Map", path: "/map" },
    { icon: PlusCircle, label: "Add", path: "/contribute" },
    { icon: Radio, label: "Live", path: "/live" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="mx-auto flex max-w-device min-h-safe flex-col bg-canvas text-ink">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-16">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-device border-t border-hairline bg-surface/95 backdrop-blur">
        <div className="flex items-center justify-around pb-safe">
          {tabs.map((t) => {
            const active = location.pathname.startsWith(t.path);
            return (
              <button
                key={t.path}
                onClick={() => navigate(t.path)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                  active ? "text-m-blue" : "text-muted"
                }`}
              >
                <t.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] machined">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
