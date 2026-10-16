import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Shield,
  Key,
  Copy,
  Check,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export const Account: React.FC = () => {
  const { user, token, isAdmin, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setStatusMessage(null);
    const res = await updateProfile({ name });
    setIsUpdating(false);
    if (res.success) {
      setStatusMessage({
        type: "success",
        text: "Account details updated successfully!",
      });
    } else {
      if (
        res.error === "Missing token" ||
        res.error === "Invalid token" ||
        res.error === "Token expired"
      ) {
        logout();
        window.location.hash = "#/";
        return;
      }
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to update profile",
      });
    }
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container" style={{ paddingBottom: 60, maxWidth: 860 }}>
      <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Account Settings</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        Manage your user profile, authentication credentials, and API access
        keys.
      </p>

      {statusMessage && (
        <div
          className={`alert alert-${statusMessage.type === "success" ? "success" : "danger"}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
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

      <div className="grid-2">
        {/* Profile Details */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="card" style={{ height: "100%", width: "100%" }}>
            <div
              className="card-body"
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div className="icon-badge">
                  <User size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                    User Profile
                  </h4>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Personal account details and permissions
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleUpdate}
                style={{ display: "flex", flexDirection: "column", flex: 1 }}
              >
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label
                    className="form-label"
                    style={{ fontWeight: 600, fontSize: 13 }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={user?.email || ""}
                    disabled
                    style={{
                      backgroundColor: "var(--bg-header)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <span
                    className="form-hint"
                    style={{ fontSize: 12, marginTop: 4 }}
                  >
                    Primary email identifier (cannot be changed).
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label
                    className="form-label"
                    style={{ fontWeight: 600, fontSize: 13 }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label
                    className="form-label"
                    style={{ fontWeight: 600, fontSize: 13 }}
                  >
                    Role & Permissions
                  </label>
                  <div style={{ marginTop: 4 }}>
                    <span
                      className="badge badge-info"
                      style={{
                        marginRight: 6,
                        fontSize: 12,
                        padding: "4px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {user?.role || "standard"}
                    </span>
                    {isAdmin && (
                      <span
                        className="badge badge-danger"
                        style={{
                          fontSize: 12,
                          padding: "4px 8px",
                          borderRadius: 4,
                        }}
                      >
                        <Shield
                          size={12}
                          style={{ marginRight: 4, verticalAlign: "middle" }}
                        />
                        Administrator
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "auto", paddingTop: 10 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                    style={{
                      height: 40,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 600,
                    }}
                  >
                    <Save size={16} />
                    {isUpdating ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* API Access Key & Token */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="card" style={{ height: "100%", width: "100%" }}>
            <div
              className="card-body"
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div className="icon-badge">
                  <Key size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                    API Token & Authentication
                  </h4>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    REST API credentials & active session
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label
                  className="form-label"
                  style={{ fontWeight: 600, fontSize: 13 }}
                >
                  Active Session Token
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className="input"
                    value={token || "No active token"}
                    readOnly
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      backgroundColor: "var(--bg-header)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  />
                  <span className="input-action">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={copyToken}
                      disabled={!token}
                      title="Copy Token"
                    >
                      {copied ? (
                        <Check size={16} className="text-success" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </span>
                </div>
                <span
                  className="form-hint"
                  style={{ fontSize: 12, marginTop: 4 }}
                >
                  Pass this in HTTP headers as{" "}
                  <code>token: &lt;YOUR_TOKEN&gt;</code> for REST API calls.
                </span>
              </div>

              <div
                style={{
                  background: "var(--bg-header)",
                  border: "1px solid var(--border-color)",
                  padding: 14,
                  borderRadius: "var(--radius-card)",
                  marginTop: "auto",
                }}
              >
                <strong
                  style={{
                    fontSize: 12,
                    display: "block",
                    marginBottom: 6,
                    color: "var(--text-color)",
                  }}
                >
                  Example cURL Request:
                </strong>
                <pre
                  style={{
                    margin: 0,
                    padding: 10,
                    fontSize: 11,
                    background: "#272822",
                    color: "#f8f8f2",
                    borderRadius: 4,
                    overflowX: "auto",
                  }}
                >
                  {`curl -X GET http://localhost:1345/users \\
  -H "token: ${token || "<TOKEN>"}" \\
  -H "Accept: application/json"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
