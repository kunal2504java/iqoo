import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Onboarding from "./screens/Onboarding";
import Feed from "./screens/Feed";
import NoteDetail from "./screens/NoteDetail";
import Contribute from "./screens/Contribute";
import DriveDetail from "./screens/DriveDetail";
import EventsFeed from "./screens/EventsFeed";
import Profile from "./screens/Profile";
import Oracle from "./screens/Oracle";
import CampusMap from "./screens/CampusMap";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center bg-canvas text-muted">Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Onboarding />} />
        <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
        <Route path="/post/:id" element={<PrivateRoute><NoteDetail /></PrivateRoute>} />
        <Route path="/contribute" element={<PrivateRoute><Contribute /></PrivateRoute>} />
        <Route path="/drive/:id/candidates" element={<PrivateRoute><DriveDetail /></PrivateRoute>} />
        <Route path="/drive/:id" element={<PrivateRoute><DriveDetail /></PrivateRoute>} />
        <Route path="/live" element={<PrivateRoute><EventsFeed /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/oracle" element={<PrivateRoute><Oracle /></PrivateRoute>} />
        <Route path="/map" element={<PrivateRoute><CampusMap /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
