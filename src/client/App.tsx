import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { ResourceList } from "./pages/ResourceList";
import { Account } from "./pages/Account";
import { Docs } from "./pages/Docs";
import config from "./config";
import api from "./api/client";
import { useAuth } from "./context/AuthContext";

export function parseRouteFromLocation(
  hashOverride?: string,
  tokenOverride?: string | null,
): { view: string; resource: string } {
  let hash = "";
  if (typeof hashOverride === "string") {
    hash = hashOverride.replace(/^#\/?/, "");
  } else if (typeof window !== "undefined") {
    hash = window.location.hash.replace(/^#\/?/, "");
  }

  if (!hash || hash === "home") {
    return { view: "home", resource: "" };
  }

  const token =
    tokenOverride !== undefined
      ? tokenOverride
      : typeof window !== "undefined"
        ? api.getToken()
        : null;

  // Protected views (resources, account, docs) require authentication.
  // If there is no token, smoothly render home and reset hash.
  if (!token) {
    if (
      typeof window !== "undefined" &&
      window.location.hash &&
      window.location.hash !== "#/" &&
      window.location.hash !== "#"
    ) {
      try {
        window.history.replaceState(null, "", "#/");
      } catch {
        window.location.hash = "#/";
      }
    }
    return { view: "home", resource: "" };
  }

  if (hash === "account") {
    return { view: "account", resource: "" };
  }
  if (hash === "docs") {
    return { view: "docs", resource: "" };
  }

  // Check if hash matches a configured resource
  const resourceKeys = Object.keys(config.resources || {});
  if (resourceKeys.includes(hash)) {
    return { view: "resource", resource: hash };
  }

  return { view: "home", resource: "" };
}

function AppContent() {
  const [routeState, setRouteState] = useState(() => parseRouteFromLocation());
  const currentView = routeState.view;
  const activeResource = routeState.resource;
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  const parseRoute = () => {
    const next = parseRouteFromLocation();
    setRouteState(next);
  };

  useEffect(() => {
    window.addEventListener("hashchange", parseRoute);
    return () => window.removeEventListener("hashchange", parseRoute);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && currentView !== "home") {
        handleNavigate("home");
      } else if (currentView === "resource" && activeResource) {
        const rc = (config.resources as Record<string, any>)[activeResource];
        if (rc?.admin && !isAdmin) {
          handleNavigate("home");
        }
      }
    }
  }, [currentView, activeResource, isAuthenticated, isAdmin, isLoading]);

  const handleNavigate = (view: string, resourceName?: string) => {
    if (view === "home") {
      setRouteState({ view: "home", resource: "" });
      window.location.hash = "#/";
    } else if (view === "account") {
      setRouteState({ view: "account", resource: "" });
      window.location.hash = "#/account";
    } else if (view === "docs") {
      setRouteState({ view: "docs", resource: "" });
      window.location.hash = "#/docs";
    } else if (view === "resource" && resourceName) {
      setRouteState({ view: "resource", resource: resourceName });
      window.location.hash = `#/${resourceName}`;
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeResource={activeResource}
      />

      <main
        style={{
          flex: currentView === "resource" ? "1 1 0" : "1 0 auto",
          display: "flex",
          flexDirection: "column",
          minHeight: currentView === "resource" ? 0 : "auto",
        }}
      >
        {currentView === "home" && <Home onNavigate={handleNavigate} />}
        {currentView === "account" && <Account />}
        {currentView === "docs" && <Docs />}
        {currentView === "resource" && activeResource && (
          <ResourceList resourceName={activeResource} />
        )}
      </main>

      {currentView !== "resource" && <Footer />}
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
