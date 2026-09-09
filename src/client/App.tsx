import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { ResourceList } from "./pages/ResourceList";
import { Account } from "./pages/Account";
import { Docs } from "./pages/Docs";
import config from "./config";

function AppContent() {
  const [currentView, setCurrentView] = useState<string>("home");
  const [activeResource, setActiveResource] = useState<string>("");

  const parseRoute = () => {
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash || hash === "home") {
      setCurrentView("home");
      setActiveResource("");
    } else if (hash === "account") {
      setCurrentView("account");
      setActiveResource("");
    } else if (hash === "docs") {
      setCurrentView("docs");
      setActiveResource("");
    } else {
      // Check if hash matches a configured resource
      const resourceKeys = Object.keys(config.resources || {});
      if (resourceKeys.includes(hash)) {
        setCurrentView("resource");
        setActiveResource(hash);
      } else {
        setCurrentView("home");
        setActiveResource("");
      }
    }
  };

  useEffect(() => {
    parseRoute();
    window.addEventListener("hashchange", parseRoute);
    return () => window.removeEventListener("hashchange", parseRoute);
  }, []);

  const handleNavigate = (view: string, resourceName?: string) => {
    if (view === "home") {
      window.location.hash = "#/";
    } else if (view === "account") {
      window.location.hash = "#/account";
    } else if (view === "docs") {
      window.location.hash = "#/docs";
    } else if (view === "resource" && resourceName) {
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

      <main style={{ flex: 1 }}>
        {currentView === "home" && <Home onNavigate={handleNavigate} />}
        {currentView === "account" && <Account />}
        {currentView === "docs" && <Docs />}
        {currentView === "resource" && activeResource && (
          <ResourceList resourceName={activeResource} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
