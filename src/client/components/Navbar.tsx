import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";
import {
  Shield,
  User as UserIcon,
  LogOut,
  Palette,
  Activity,
  BookOpen,
  Layers,
  Sparkles,
} from "lucide-react";
import config from "../config";

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
  const { user, isAuthenticated, isAdmin, logout, loginGuest } = useAuth();
  const { currentTheme, setTheme, themes } = useTheme();
  const { onlineCount, isConnected } = useSocket();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const resources = Object.entries(config.resources || {}).filter(
    ([name, res]: [string, any]) => !res.exclude,
  );

  return (
    <nav
      className="navbar navbar-default"
      style={{
        borderRadius: 0,
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div className="container-fluid">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            onClick={() => {}}
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
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
            <span>{config.site || "MoNoApps Core"}</span>
          </a>
        </div>

        <div className="collapse navbar-collapse">
          {/* Resource Navigation Links */}
          <ul className="nav navbar-nav">
            <li className={currentView === "home" ? "active" : ""}>
              <a
                href="#/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("home");
                }}
              >
                Home
              </a>
            </li>

            {isAuthenticated &&
              resources.map(([key, res]: [string, any]) => {
                if (res.admin && !isAdmin) return null;
                const isActive =
                  currentView === "resource" && activeResource === key;
                return (
                  <li key={key} className={isActive ? "active" : ""}>
                    <a
                      href={`#/${key}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate("resource", key);
                      }}
                      style={{ textTransform: "capitalize" }}
                    >
                      {key}
                    </a>
                  </li>
                );
              })}

            <li className={currentView === "docs" ? "active" : ""}>
              <a
                href="#/docs"
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
          </ul>

          {/* Right Action Icons & Status */}
          <ul
            className="nav navbar-nav navbar-right"
            style={{ display: "flex", alignItems: "center" }}
          >
            {/* Realtime Live Engine Status */}
            <li>
              <span
                className="navbar-text"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  paddingRight: 10,
                  fontSize: "12px",
                }}
                title={
                  isConnected ? "Socket.IO connected" : "Socket.IO disconnected"
                }
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: isConnected ? "#4CAF50" : "#F44336",
                    display: "inline-block",
                  }}
                />
                <Activity size={14} />
                <span>{onlineCount} live</span>
              </span>
            </li>

            {/* Bootswatch Live Theme Switcher */}
            <li className={`dropdown ${isThemeOpen ? "open" : ""}`}>
              <a
                href="#"
                className="dropdown-toggle"
                onClick={(e) => {
                  e.preventDefault();
                  setIsThemeOpen(!isThemeOpen);
                  setIsUserMenuOpen(false);
                }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Palette size={16} />
                <span style={{ textTransform: "capitalize" }}>
                  Theme: {currentTheme}
                </span>
                <span className="caret"></span>
              </a>
              {isThemeOpen && (
                <ul
                  className="dropdown-menu"
                  style={{
                    display: "block",
                    maxHeight: 300,
                    overflowY: "auto",
                  }}
                >
                  {themes.map((t) => (
                    <li
                      key={t.name}
                      className={currentTheme === t.name ? "active" : ""}
                    >
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setTheme(t.name);
                          setIsThemeOpen(false);
                        }}
                      >
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* User Session & Auth Buttons */}
            {isAuthenticated ? (
              <li className={`dropdown ${isUserMenuOpen ? "open" : ""}`}>
                <a
                  href="#"
                  className="dropdown-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsThemeOpen(false);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <UserIcon size={16} />
                  <span>{user?.name || user?.email || "User"}</span>
                  {isAdmin && (
                    <span
                      className="label label-danger"
                      style={{ marginLeft: 4 }}
                    >
                      Admin
                    </span>
                  )}
                  <span className="caret"></span>
                </a>
                {isUserMenuOpen && (
                  <ul className="dropdown-menu" style={{ display: "block" }}>
                    <li>
                      <a
                        href="#/account"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate("account");
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <UserIcon size={14} style={{ marginRight: 6 }} />
                        Account Profile
                      </a>
                    </li>
                    <li role="separator" className="divider"></li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          logout();
                          setIsUserMenuOpen(false);
                          onNavigate("home");
                        }}
                      >
                        <LogOut size={14} style={{ marginRight: 6 }} />
                        Sign Out
                      </a>
                    </li>
                  </ul>
                )}
              </li>
            ) : (
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 15px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate("home")}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-default btn-sm"
                  onClick={async () => {
                    await loginGuest();
                  }}
                  title="Fast Guest Access"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Sparkles size={13} />
                  Guest Access
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
