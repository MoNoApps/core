import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  User as UserIcon,
  LogOut,
  Palette,
  BookOpen,
  Layers,
  RefreshCw,
  Check,
  Menu,
  X,
  Home as HomeIcon,
  ChevronDown,
  FolderKanban,
} from "lucide-react";
import { getResourceIcon } from "./icons";
import config from "../config";
import { formatResourceTitle } from "../utils";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, resourceName?: string) => void;
  activeResource?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeResource,
}) => {
  const { isAuthenticated, isAdmin, isViewer, isLoading, logout } = useAuth();
  const { currentTheme, setTheme, themes } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const themeRef = useRef<HTMLLIElement | null>(null);
  const resourcesRef = useRef<HTMLLIElement | null>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        themeRef.current &&
        !themeRef.current.contains(event.target as Node)
      ) {
        setIsThemeOpen(false);
      }
      if (
        resourcesRef.current &&
        !resourcesRef.current.contains(event.target as Node)
      ) {
        setIsResourcesOpen(false);
      }
    }
    if (isThemeOpen || isResourcesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isThemeOpen, isResourcesOpen]);

  // Handle ESC key to close drawer or dropdowns
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
        setIsThemeOpen(false);
        setIsResourcesOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const resources = Object.entries(config.resources || {}).filter(
    ([_name, res]: [string, any]) => {
      if (res.exclude) return false;
      if (res.admin && !isAdmin) return false;
      return true;
    },
  );

  const hasResources = isAuthenticated && resources.length > 0;
  const hasDocs = isAuthenticated;
  const hasOtherNavOptions = hasResources || hasDocs;

  const handleMobileNavigate = (view: string, resourceName?: string) => {
    setIsDrawerOpen(false);
    onNavigate(view, resourceName);
  };

  const handleResourceSelect = (key: string) => {
    setIsResourcesOpen(false);
    onNavigate("resource", key);
  };

  const ActiveResourceIcon = activeResource
    ? getResourceIcon(activeResource)
    : FolderKanban;

  return (
    <>
      <nav
        className="navbar"
        style={{
          marginBottom: currentView === "resource" ? 10 : 24,
          flexShrink: 0,
        }}
      >
        <div className="navbar-container">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Hamburger Button for Tablets & Phones (< 992px) */}
            {hasOtherNavOptions && (
              <button
                type="button"
                className="navbar-hamburger-btn"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
                title="Navigation Menu"
              >
                {isDrawerOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}

            <a
              className="navbar-brand"
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("home");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
              }}
            >
              <Layers className="text-primary" size={22} />
              <span>{config.site || "Core"}</span>
            </a>
          </div>

          <div className="navbar-menu">
            {/* Desktop Navigation Links */}
            {hasOtherNavOptions && (
              <ul className="navbar-nav navbar-nav-links">
                <li>
                  <a
                    href="#/"
                    className={`nav-link ${currentView === "home" ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("home");
                    }}
                  >
                    <HomeIcon size={16} />
                    <span>Home</span>
                  </a>
                </li>

                {/* Elevated Resources Dropdown Selector */}
                {hasResources && (
                  <li
                    ref={resourcesRef}
                    className={`dropdown ${isResourcesOpen ? "open" : ""}`}
                  >
                    <button
                      type="button"
                      className={`nav-link ${currentView === "resource" ? "active" : ""}`}
                      onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                      style={{
                        background: "transparent",
                        border: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        cursor: "pointer",
                      }}
                    >
                      <ActiveResourceIcon size={16} className="text-primary" />
                      <span>
                        {activeResource && currentView === "resource"
                          ? formatResourceTitle(activeResource)
                          : "Resources"}
                      </span>
                      <span
                        className="badge"
                        style={{
                          fontSize: 10,
                          padding: "2px 5px",
                          borderRadius: 10,
                          backgroundColor: "var(--bg-badge)",
                          color: "var(--text-color)",
                        }}
                      >
                        {resources.length}
                      </span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: isResourcesOpen
                            ? "rotate(180deg)"
                            : "rotate(0)",
                          transition: "transform 0.15s ease",
                        }}
                      />
                    </button>

                    {isResourcesOpen && (
                      <ul
                        className="dropdown-menu dropdown-menu-left"
                        style={{
                          display: "block",
                          minWidth: 260,
                          maxHeight: 440,
                          overflowY: "auto",
                        }}
                      >
                        <li
                          style={{
                            padding: "8px 14px",
                            borderBottom: "1px solid var(--border-color)",
                            backgroundColor: "var(--bg-header)",
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "var(--text-muted)",
                          }}
                        >
                          Business Resources ({resources.length})
                        </li>

                        {resources.map(([key, res]: [string, any]) => {
                          if (res.admin && !isAdmin) return null;
                          const Icon = getResourceIcon(key);
                          const isActive =
                            currentView === "resource" &&
                            activeResource === key;

                          return (
                            <li key={key} className={isActive ? "active" : ""}>
                              <button
                                type="button"
                                onClick={() => handleResourceSelect(key)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  width: "100%",
                                  padding: "10px 14px",
                                  textAlign: "left",
                                }}
                              >
                                <Icon
                                  size={16}
                                  className={
                                    isActive ? "text-primary" : "text-muted"
                                  }
                                />
                                <span
                                  style={{
                                    flex: 1,
                                    fontWeight: isActive ? 600 : 500,
                                  }}
                                >
                                  {formatResourceTitle(key)}
                                </span>
                                {res.admin && (
                                  <span
                                    className="badge badge-danger"
                                    style={{
                                      fontSize: 9,
                                      padding: "2px 5px",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Admin
                                  </span>
                                )}
                                {isActive && (
                                  <Check size={14} className="text-primary" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                )}

                {/* API Documentation */}
                {hasDocs && (
                  <li>
                    <a
                      href="#/docs"
                      className={`nav-link ${currentView === "docs" ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate("docs");
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <BookOpen size={16} />
                      <span>API Docs</span>
                    </a>
                  </li>
                )}
              </ul>
            )}

            {/* Right Action Icons & Status */}
            <ul
              className="navbar-nav navbar-actions"
              style={{ display: "flex", alignItems: "center" }}
            >
              {/* Live Theme Switcher */}
              <li
                ref={themeRef}
                className={`dropdown nav-tooltip-container ${isThemeOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="nav-icon-link"
                  onClick={() => setIsThemeOpen(!isThemeOpen)}
                  aria-label="Change theme"
                  title="Theme"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Palette size={18} />
                </button>
                {!isThemeOpen && (
                  <span className="nav-tooltip" role="tooltip">
                    Theme
                  </span>
                )}
                {isThemeOpen && (
                  <ul className="dropdown-menu" style={{ display: "block" }}>
                    {themes.map((t) => (
                      <li
                        key={t.name}
                        className={currentTheme === t.name ? "active" : ""}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setTheme(t.name);
                            setIsThemeOpen(false);
                          }}
                        >
                          <span>{t.label}</span>
                          {currentTheme === t.name && <Check size={14} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              {/* User Session */}
              {isAuthenticated ? (
                <>
                  <li
                    className={`nav-tooltip-container ${currentView === "account" ? "active" : ""}`}
                  >
                    <a
                      href="#/account"
                      className="nav-icon-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate("account");
                      }}
                      title={
                        isAdmin
                          ? "Profile (Admin)"
                          : isViewer
                            ? "Profile (Viewer)"
                            : "Profile"
                      }
                      aria-label="Profile"
                    >
                      <UserIcon size={18} />
                    </a>
                    <span className="nav-tooltip" role="tooltip">
                      {isAdmin
                        ? "Profile (Admin)"
                        : isViewer
                          ? "Profile (Viewer)"
                          : "Profile"}
                    </span>
                  </li>
                  <li className="nav-tooltip-container">
                    <a
                      href="#"
                      className="nav-icon-link nav-signout-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        logout();
                        onNavigate("home");
                      }}
                      title="Sign Out"
                      aria-label="Sign Out"
                    >
                      <LogOut size={18} />
                    </a>
                    <span className="nav-tooltip" role="tooltip">
                      Sign Out
                    </span>
                  </li>
                </>
              ) : isLoading ? (
                <li
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 15px",
                    height: 50,
                  }}
                >
                  <span
                    className="text-muted"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "12px",
                    }}
                  >
                    <RefreshCw size={13} className="spin" />
                    Verifying...
                  </span>
                </li>
              ) : (
                <>
                  <li
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 15px 8px 4px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onNavigate("home")}
                    >
                      Sign In
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Responsive Hamburger Slide-out Drawer for Mobile & Tablets */}
      {isDrawerOpen && (
        <>
          <div
            className="navbar-drawer-backdrop"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="navbar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            <div className="navbar-drawer-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <Layers className="text-primary" size={22} />
                <span>{config.site || "Core"}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close navigation"
                style={{
                  padding: "4px 8px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="navbar-drawer-content">
              {/* Main Links */}
              {hasOtherNavOptions && (
                <div className="navbar-drawer-section">
                  <span className="navbar-drawer-section-title">
                    Navigation
                  </span>
                  <button
                    type="button"
                    className={`navbar-drawer-item ${currentView === "home" ? "active" : ""}`}
                    onClick={() => handleMobileNavigate("home")}
                  >
                    <HomeIcon size={18} className="text-primary" />
                    <span>Home Workspace</span>
                  </button>
                  {hasDocs && (
                    <button
                      type="button"
                      className={`navbar-drawer-item ${currentView === "docs" ? "active" : ""}`}
                      onClick={() => handleMobileNavigate("docs")}
                    >
                      <BookOpen size={18} className="text-primary" />
                      <span>API Documentation</span>
                    </button>
                  )}
                </div>
              )}

              {/* 10 Business Resources */}
              {isAuthenticated && (
                <div className="navbar-drawer-section">
                  <span className="navbar-drawer-section-title">
                    Resources ({resources.length})
                  </span>
                  <div className="navbar-drawer-resource-grid">
                    {resources.map(([key, res]: [string, any]) => {
                      if (res.admin && !isAdmin) return null;
                      const Icon = getResourceIcon(key);
                      const isActive =
                        currentView === "resource" && activeResource === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`navbar-drawer-item ${isActive ? "active" : ""}`}
                          onClick={() => handleMobileNavigate("resource", key)}
                        >
                          <Icon size={18} className="text-primary" />
                          <span style={{ flex: 1, textAlign: "left" }}>
                            {formatResourceTitle(key)}
                          </span>
                          {res.admin && (
                            <span
                              className="badge badge-danger"
                              style={{
                                fontSize: 9,
                                padding: "2px 5px",
                                textTransform: "uppercase",
                              }}
                            >
                              Admin
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Account & User Preferences */}
              <div className="navbar-drawer-section">
                <span className="navbar-drawer-section-title">Account</span>
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      className={`navbar-drawer-item ${currentView === "account" ? "active" : ""}`}
                      onClick={() => handleMobileNavigate("account")}
                    >
                      <UserIcon size={18} className="text-primary" />
                      <span>
                        Profile & Security{" "}
                        {isAdmin ? "(Admin)" : isViewer ? "(Viewer)" : ""}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="navbar-drawer-item text-danger"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        logout();
                        onNavigate("home");
                      }}
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="navbar-drawer-item"
                      onClick={() => handleMobileNavigate("home")}
                    >
                      <UserIcon size={18} className="text-primary" />
                      <span>Sign In</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Navbar;
