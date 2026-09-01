import { Navigate, Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

/**
 * MainLayout — the application shell: navbar across the top, sidebar at left,
 * routed content in the main column.
 *
 * The redirect below is a UI convenience so the shell is never rendered without
 * a session to describe. It is NOT a security boundary — real route protection
 * belongs with the backend token check once /auth is connected.
 */
function MainLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="app-shell">
      <Navbar />

      <div className="app-shell__body">
        <Sidebar />

        <main className="app-shell__main" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
