import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import config from "../config";
import {
  Lock,
  Mail,
  Server,
  Zap,
  Database,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  FolderKanban,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { getResourceIcon } from "../components/icons";
import { formatResourceTitle } from "../utils";

interface HomeProps {
  onNavigate: (view: string, resourceName?: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, isAdmin, isLoading, login } = useAuth();

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resource counts for authenticated card
  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>(
    {},
  );
  const [countsLoading, setCountsLoading] = useState(false);

  const accessibleResources = Object.entries(config.resources || {}).filter(
    ([, res]: [string, any]) => {
      if (res.exclude) return false;
      if (res.admin && !isAdmin) return false;
      return true;
    },
  );

  const firstResourceKey = accessibleResources[0]?.[0] || "products";
  const firstResourceName = formatResourceTitle(firstResourceKey);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    setCountsLoading(true);

    Promise.all(
      accessibleResources.map(async ([key]) => {
        try {
          const res = await api.getResourceCount(key);
          if (res.success && typeof res.count === "number") {
            return [key, res.count] as const;
          }
          if (res.success && typeof (res.data as any)?.count === "number") {
            return [key, (res.data as any).count] as const;
          }
          const fallbackRes = await api.getResources(key);
          if (fallbackRes.success && Array.isArray(fallbackRes.data)) {
            return [key, fallbackRes.data.length] as const;
          }
          return [key, 0] as const;
        } catch {
          return [key, 0] as const;
        }
      }),
    ).then((results) => {
      if (isMounted) {
        const counts: Record<string, number> = {};
        results.forEach(([k, c]) => {
          counts[k] = c;
        });
        setResourceCounts(counts);
        setCountsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    const res = loginEmail
      ? await login(loginEmail, password)
      : await login(password);
    setIsSubmitting(false);
    if (!res.success) {
      setStatusMessage({
        type: "error",
        text: res.error || "Login failed. Please check credentials.",
      });
    } else {
      setStatusMessage({
        type: "success",
        text: "Logged in successfully!",
      });
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Hero Header Card */}
      <div className="card hero-card">
        <div className="card-body">
          <h1 className="hero-title">Workspace</h1>
          <p className="hero-subtitle">
            Manage business resources, data records, and API integrations in one
            unified hub.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => onNavigate("resource", firstResourceKey)}
                  style={{ height: 40, fontWeight: 600 }}
                >
                  Explore {firstResourceName} Resource &rarr;
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigate("docs")}
                  style={{ height: 40, fontWeight: 600 }}
                >
                  View API Documentation
                </button>
              </>
            ) : isLoading ? (
              <button
                className="btn btn-primary"
                disabled
                style={{
                  height: 40,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <RefreshCw size={16} className="spin" />
                Verifying Session...
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const el = document.querySelector(
                      'input[type="email"]',
                    ) as HTMLInputElement;
                    if (el) el.focus();
                  }}
                  style={{ height: 40, fontWeight: 600 }}
                >
                  Sign In to Workspace &rarr;
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Equal-Height Layout Row */}
      <div className="home-layout-row">
        {/* Left Column: Resources (Authenticated) or Authentication Card */}
        <div className="home-auth-col">
          {isAuthenticated ? (
            <div className="card">
              <div className="card-body">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div className="icon-badge">
                      <FolderKanban size={20} />
                    </div>
                    <h4 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                      Active Resources
                    </h4>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 10,
                      backgroundColor: "var(--bg-badge)",
                      color: "var(--text-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {accessibleResources.length} Resources
                  </span>
                </div>

                <p
                  className="card-desc"
                  style={{ marginBottom: 16, flex: "0 0 auto" }}
                >
                  Live business resources configured in your workspace with
                  real-time record counts.
                </p>

                <div
                  className="home-resource-list"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    flex: "1 1 auto",
                  }}
                >
                  {accessibleResources.map(([key, res]: [string, any]) => {
                    const count = resourceCounts[key];
                    const Icon = getResourceIcon(key);
                    return (
                      <a
                        key={key}
                        href={`#/${key}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate("resource", key);
                        }}
                        className="home-resource-item"
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Icon size={16} className="text-primary" />
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
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
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {countsLoading && count === undefined ? (
                            <RefreshCw size={12} className="spin text-muted" />
                          ) : (
                            <span
                              className="badge"
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                backgroundColor: "var(--bg-card)",
                                color: "var(--text-color)",
                                border: "1px solid var(--border-color)",
                                padding: "3px 8px",
                                borderRadius: 10,
                              }}
                            >
                              {(count ?? 0).toLocaleString()}
                            </span>
                          )}
                          <ArrowRight
                            size={14}
                            className="resource-arrow"
                            style={{ opacity: 0.6 }}
                          />
                        </div>
                      </a>
                    );
                  })}
                </div>

                {/* Session overview footer */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#4CAF50",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    Signed in as{" "}
                    <strong style={{ color: "var(--text-color)" }}>
                      {user?.name || user?.email || "User"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="card">
              <div
                className="card-body"
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 280,
                }}
              >
                <RefreshCw
                  size={24}
                  className="spin text-muted"
                  style={{ marginBottom: 12 }}
                />
                <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
                  Verifying workspace access...
                </p>
              </div>
            </div>
          ) : (
            <div className="card auth-card">
              <div
                className="card-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div className="icon-badge">
                  <Lock size={18} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                  Sign In to Workspace
                </h4>
              </div>

              <div className="card-body">
                {statusMessage && (
                  <div
                    className={`alert alert-${statusMessage.type === "success" ? "success" : "danger"}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {statusMessage.type === "success" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">
                        Email Address{" "}
                        <span
                          className="text-muted"
                          style={{ fontWeight: 400, fontSize: 11 }}
                        >
                          (or leave blank for Token)
                        </span>
                      </label>
                      <div className="input-group">
                        <span className="input-addon">
                          <Mail size={15} />
                        </span>
                        <input
                          type="email"
                          className="input"
                          placeholder="user@company.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">
                        Password or Access Token
                      </label>
                      <div className="input-group">
                        <span className="input-addon">
                          <Lock size={15} />
                        </span>
                        <input
                          type="password"
                          className="input"
                          placeholder="Enter password or access token"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "auto" }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-block"
                      disabled={isSubmitting}
                      style={{ height: 40, fontWeight: 600 }}
                    >
                      {isSubmitting ? "Authenticating..." : "Log In"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Platform Architecture & Modules (Equal-Height 2x2 Grid) */}
        <div className="home-features-col">
          <div className="feature-grid">
            <div className="card">
              <div className="card-body">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div className="icon-badge">
                    <Server size={20} />
                  </div>
                  <h4 className="card-title">Application Backend</h4>
                </div>
                <p className="card-desc">
                  Secure, low-latency API foundation built for high availability
                  and seamless data flow.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div className="icon-badge">
                    <Database size={20} />
                  </div>
                  <h4 className="card-title">Data Management</h4>
                </div>
                <p className="card-desc">
                  Reliable database records with role-based access, automated
                  indexing, and input sanitization.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div className="icon-badge">
                    <Zap size={20} />
                  </div>
                  <h4 className="card-title">Event Broadcasting</h4>
                </div>
                <p className="card-desc">
                  Asynchronous change propagation and decoupled event messaging
                  powered by a high-throughput event bus.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div className="icon-badge">
                    <FileCode2 size={20} />
                  </div>
                  <h4 className="card-title">Declarative Resources</h4>
                </div>
                <p className="card-desc">
                  Create custom business entities and interactive forms directly
                  from data schemas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
