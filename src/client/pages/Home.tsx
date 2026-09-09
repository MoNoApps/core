import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Lock,
  Mail,
  KeyRound,
  Sparkles,
  Server,
  Zap,
  Database,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import config from "../config";

interface HomeProps {
  onNavigate: (view: string, resourceName?: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, login, loginGuest, register, recover } =
    useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "recover">(
    "login",
  );

  // Form states
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    const res = await login(password);
    setIsSubmitting(false);
    if (!res.success) {
      setStatusMessage({
        type: "error",
        text: res.error || "Login failed. Please check password.",
      });
    } else {
      setStatusMessage({
        type: "success",
        text: "Logged in successfully!",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    const res = await register(email);
    setIsSubmitting(false);
    if (res.success) {
      setStatusMessage({
        type: "success",
        text:
          res.message ||
          "Registration link sent! Please check your email inbox.",
      });
      setEmail("");
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Registration failed.",
      });
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    const res = await recover(email);
    setIsSubmitting(false);
    if (res.success) {
      setStatusMessage({
        type: "success",
        text:
          res.message || "Recovery password instructions sent to your email.",
      });
      setEmail("");
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Recovery failed.",
      });
    }
  };

  const handleGuestLogin = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    const res = await loginGuest();
    setIsSubmitting(false);
    if (!res.success) {
      setStatusMessage({
        type: "error",
        text: res.error || "Guest login unavailable or disabled.",
      });
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Hero Header */}
      <div
        className="jumbotron"
        style={{ borderRadius: 8, padding: "36px 40px", marginBottom: 32 }}
      >
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
          {config.site || "MoNoApps Core"}
        </h1>
        <p className="lead" style={{ fontSize: 18, opacity: 0.9 }}>
          Enterprise full-stack foundation powered by{" "}
          <strong>Node.js 24</strong>, <strong>MongoDB 8</strong>, and{" "}
          <strong>React 19 + TypeScript</strong> with sub-second reactivity and
          dynamic NoSQL schemas.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {isAuthenticated ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onNavigate("resource", "products")}
            >
              Explore Products Resource &rarr;
            </button>
          ) : (
            <button
              className="btn btn-success btn-lg"
              onClick={handleGuestLogin}
              disabled={isSubmitting}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Sparkles size={20} />
              Instant Guest Access
            </button>
          )}
          <button
            className="btn btn-default btn-lg"
            onClick={() => onNavigate("docs")}
          >
            Explore API Specs
          </button>
        </div>
      </div>

      <div className="row">
        {/* Left Column: Authentication / User Dashboard */}
        <div className="col-md-5">
          <div
            className="panel panel-default"
            style={{
              borderRadius: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div className="panel-heading" style={{ padding: "12px 20px" }}>
              <ul className="nav nav-pills nav-justified">
                <li className={activeTab === "login" ? "active" : ""}>
                  <a
                    href="#login"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("login");
                      setStatusMessage(null);
                    }}
                  >
                    Sign In
                  </a>
                </li>
                <li className={activeTab === "register" ? "active" : ""}>
                  <a
                    href="#register"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("register");
                      setStatusMessage(null);
                    }}
                  >
                    Register
                  </a>
                </li>
                <li className={activeTab === "recover" ? "active" : ""}>
                  <a
                    href="#recover"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("recover");
                      setStatusMessage(null);
                    }}
                  >
                    Recover
                  </a>
                </li>
              </ul>
            </div>

            <div className="panel-body" style={{ padding: 24 }}>
              {statusMessage && (
                <div
                  className={`alert alert-${statusMessage.type === "success" ? "success" : "danger"}`}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {isAuthenticated && activeTab === "login" ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <CheckCircle2
                    size={48}
                    className="text-success"
                    style={{ marginBottom: 12 }}
                  />
                  <h4 style={{ fontWeight: 600 }}>You are authenticated!</h4>
                  <p className="text-muted">
                    Logged in as{" "}
                    <strong>{user?.name || user?.email || "User"}</strong>
                  </p>
                  <div
                    style={{
                      marginTop: 20,
                      display: "flex",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <button
                      className="btn btn-primary"
                      onClick={() => onNavigate("account")}
                    >
                      Manage Profile
                    </button>
                    <button
                      className="btn btn-default"
                      onClick={() => onNavigate("resource", "tasks")}
                    >
                      View Tasks
                    </button>
                  </div>
                </div>
              ) : activeTab === "login" ? (
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>
                      Password / Access Key
                    </label>
                    <div className="input-group">
                      <span className="input-group-addon">
                        <Lock size={16} />
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter password or token key"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={isSubmitting}
                    style={{ marginTop: 16, height: 42, fontWeight: 600 }}
                  >
                    {isSubmitting ? "Authenticating..." : "Sign In"}
                  </button>

                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <button
                      type="button"
                      className="btn btn-link btn-sm"
                      onClick={handleGuestLogin}
                      disabled={isSubmitting}
                    >
                      ⚡ Fast Sign In as Guest User
                    </button>
                  </div>
                </form>
              ) : activeTab === "register" ? (
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Email Address</label>
                    <div className="input-group">
                      <span className="input-group-addon">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <span className="help-block" style={{ fontSize: 12 }}>
                      A secure confirmation link and generated key will be sent
                      to this email.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success btn-block"
                    disabled={isSubmitting}
                    style={{ marginTop: 16, height: 42, fontWeight: 600 }}
                  >
                    {isSubmitting ? "Processing..." : "Create Account"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRecover}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Registered Email</label>
                    <div className="input-group">
                      <span className="input-group-addon">
                        <KeyRound size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <span className="help-block" style={{ fontSize: 12 }}>
                      We will reset your key and send recovery instructions.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-warning btn-block"
                    disabled={isSubmitting}
                    style={{ marginTop: 16, height: 42, fontWeight: 600 }}
                  >
                    {isSubmitting ? "Sending..." : "Send Recovery Key"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Platform Architecture & Modules */}
        <div className="col-md-7">
          <div className="row">
            <div className="col-sm-6" style={{ marginBottom: 20 }}>
              <div
                className="panel panel-default"
                style={{ height: "100%", borderRadius: 6 }}
              >
                <div className="panel-body">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Server className="text-primary" size={24} />
                    <h4 style={{ margin: 0, fontWeight: 600 }}>
                      Node 24 + Express 5
                    </h4>
                  </div>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    Native ES2024 runtime with sub-millisecond execution,
                    type-safe route controllers, and built-in microsecond test
                    runners.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-sm-6" style={{ marginBottom: 20 }}>
              <div
                className="panel panel-default"
                style={{ height: "100%", borderRadius: 6 }}
              >
                <div className="panel-body">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Database className="text-success" size={24} />
                    <h4 style={{ margin: 0, fontWeight: 600 }}>
                      MongoDB 8 Data Layer
                    </h4>
                  </div>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    Modern connection pooling and async/await driver execution
                    with dynamic schema filtering and sanitized queries.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-sm-6" style={{ marginBottom: 20 }}>
              <div
                className="panel panel-default"
                style={{ height: "100%", borderRadius: 6 }}
              >
                <div className="panel-body">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Zap className="text-warning" size={24} />
                    <h4 style={{ margin: 0, fontWeight: 600 }}>
                      Real-time Redis Pub/Sub
                    </h4>
                  </div>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    Socket.IO v4 synchronization channels automatically
                    broadcasting data modifications across connected clients.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-sm-6" style={{ marginBottom: 20 }}>
              <div
                className="panel panel-default"
                style={{ height: "100%", borderRadius: 6 }}
              >
                <div className="panel-body">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Sparkles className="text-info" size={24} />
                    <h4 style={{ margin: 0, fontWeight: 600 }}>
                      Dynamic Autoform
                    </h4>
                  </div>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    Automatic UI forms, validation, and REST API generation
                    driven purely by declarative configuration schemas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
