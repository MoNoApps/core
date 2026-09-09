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
  const { user, token, isAdmin, updateProfile } = useAuth();
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

      <div className="row">
        {/* Profile Details */}
        <div className="col-md-6">
          <div className="panel panel-default" style={{ borderRadius: 6 }}>
            <div className="panel-heading">
              <h4
                className="panel-title"
                style={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <User size={18} />
                User Profile
              </h4>
            </div>
            <div className="panel-body" style={{ padding: 20 }}>
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={user?.email || ""}
                    disabled
                    style={{ backgroundColor: "#f9f9f9" }}
                  />
                  <span className="help-block" style={{ fontSize: 12 }}>
                    Primary email identifier (cannot be changed).
                  </span>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Role & Permissions</label>
                  <div>
                    <span
                      className="label label-info"
                      style={{
                        marginRight: 6,
                        fontSize: 13,
                        padding: "4px 8px",
                      }}
                    >
                      {user?.role || "standard"}
                    </span>
                    {isAdmin && (
                      <span
                        className="label label-danger"
                        style={{ fontSize: 13, padding: "4px 8px" }}
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  <Save size={16} />
                  {isUpdating ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* API Access Key & Token */}
        <div className="col-md-6">
          <div className="panel panel-default" style={{ borderRadius: 6 }}>
            <div className="panel-heading">
              <h4
                className="panel-title"
                style={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Key size={18} />
                API Token & Authentication
              </h4>
            </div>
            <div className="panel-body" style={{ padding: 20 }}>
              <div className="form-group">
                <label>Active Session Token</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={token || "No active token"}
                    readOnly
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      backgroundColor: "#f9f9f9",
                    }}
                  />
                  <span className="input-group-btn">
                    <button
                      type="button"
                      className="btn btn-default"
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
                <span className="help-block" style={{ fontSize: 12 }}>
                  Pass this in HTTP headers as{" "}
                  <code>token: &lt;YOUR_TOKEN&gt;</code> for REST API calls.
                </span>
              </div>

              <div
                style={{
                  background: "#f5f5f5",
                  padding: 12,
                  borderRadius: 4,
                  marginTop: 16,
                }}
              >
                <strong
                  style={{ fontSize: 12, display: "block", marginBottom: 6 }}
                >
                  Example cURL Request:
                </strong>
                <pre
                  style={{
                    margin: 0,
                    padding: 8,
                    fontSize: 11,
                    background: "#272822",
                    color: "#f8f8f2",
                    borderRadius: 4,
                  }}
                >
                  {`curl -X GET http://localhost:1345/products \\
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
