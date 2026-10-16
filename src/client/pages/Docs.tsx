import React, { useState, useMemo, useEffect } from "react";
import config from "../config";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Terminal,
  Play,
  Copy,
  Check,
  Server,
  FolderKanban,
  Code2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { getResourceIcon } from "../components/icons";
import { formatResourceTitle } from "../utils";

export const Docs: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (!isLoading && !isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.hash = "#/";
    }
    return null;
  }

  // Resources from config accessible to current user
  const resources = useMemo(() => {
    return Object.entries(config.resources || {}).filter(
      ([, res]: [string, any]) => {
        if (res.exclude) return false;
        if (res.admin && !isAdmin) return false;
        return true;
      },
    );
  }, [isAdmin]);

  const [activeResource, setActiveResource] = useState<string>(
    resources[0]?.[0] || "products",
  );

  useEffect(() => {
    if (
      resources.length > 0 &&
      !resources.some(([k]) => k === activeResource)
    ) {
      setActiveResource(resources[0][0]);
    }
  }, [resources, activeResource]);

  const activeResourceConfig = useMemo(() => {
    return (config.resources as any)?.[activeResource] || {};
  }, [activeResource]);

  // Terminal & Exec state (Defaults to public /ping endpoint)
  const [terminalMethod, setTerminalMethod] = useState<
    "GET" | "POST" | "PUT" | "DELETE"
  >("GET");
  const [terminalEndpoint, setTerminalEndpoint] = useState<string>("/ping");
  const [docId, setDocId] = useState<string>("");
  const [requestBody, setRequestBody] = useState<string>("");
  const [activeFormat, setActiveFormat] = useState<
    "curl" | "fetch" | "response"
  >("curl");
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    status?: number;
    statusText?: string;
    timeMs?: number;
    data?: any;
    error?: string;
  } | null>(null);

  // Helper to generate schema sample payload
  function generateSamplePayload(schema: any): string {
    if (!schema || typeof schema !== "object") return "{}";
    const sample: Record<string, any> = {};
    for (const [key, fieldDef] of Object.entries(schema)) {
      if (key === "_id" || key === "createdAt" || key === "updatedAt") continue;
      if (typeof fieldDef === "object" && fieldDef !== null) {
        const type = (fieldDef as any).type || (fieldDef as any).tag || "text";
        if (type === "number") {
          sample[key] =
            (fieldDef as any).min !== undefined ? (fieldDef as any).min : 100;
        } else if (type === "checkbox" || type === "boolean") {
          sample[key] = true;
        } else if (type === "select") {
          sample[key] = "active";
        } else {
          sample[key] = `Sample ${key}`;
        }
      } else {
        sample[key] = `Sample ${key}`;
      }
    }
    return JSON.stringify(sample, null, 2);
  }

  // Switch active resource tab
  const handleSelectResource = (key: string) => {
    setActiveResource(key);
    setTerminalEndpoint(`/${key}`);
    setTerminalMethod("GET");
    setDocId("");
    const resConf = (config.resources as any)?.[key] || {};
    setRequestBody(generateSamplePayload(resConf.schema));
  };

  // Load endpoint into terminal
  const selectEndpoint = (
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    needsId = false,
  ) => {
    setTerminalMethod(method);
    setTerminalEndpoint(path);
    if (!needsId) {
      setDocId("");
    }
    if (method === "POST" || method === "PUT") {
      setRequestBody(generateSamplePayload(activeResourceConfig.schema));
    }
    // Scroll to terminal smoothly
    const termEl = document.getElementById("dev-terminal");
    if (termEl) {
      termEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const currentToken = api.getToken();
  const apiBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:1345`
      : "http://localhost:1345";

  // Build full URL for display
  const resolvedUrl = useMemo(() => {
    let p = terminalEndpoint;
    if (p.includes(":id")) {
      p = p.replace(":id", docId.trim() || "<ID>");
    }
    return `${apiBaseUrl}${p.startsWith("/") ? p : `/${p}`}`;
  }, [apiBaseUrl, terminalEndpoint, docId]);

  // Generate cURL command
  const curlSnippet = useMemo(() => {
    const parts: string[] = [`curl -X ${terminalMethod} "${resolvedUrl}"`];
    if (currentToken) {
      parts.push(`  -H "token: ${currentToken}"`);
    } else {
      parts.push(`  -H "token: <YOUR_AUTH_TOKEN>"`);
    }
    if (terminalMethod === "POST" || terminalMethod === "PUT") {
      parts.push(`  -H "Content-Type: application/json"`);
      if (requestBody && requestBody.trim() && requestBody.trim() !== "{}") {
        parts.push(`  -d '${requestBody.replace(/'/g, "\\'")}'`);
      }
    }
    return parts.join(" \\\n");
  }, [terminalMethod, resolvedUrl, currentToken, requestBody]);

  // Generate Fetch snippet
  const fetchSnippet = useMemo(() => {
    const headers: Record<string, string> = {
      token: currentToken || "<YOUR_AUTH_TOKEN>",
    };
    if (terminalMethod === "POST" || terminalMethod === "PUT") {
      headers["Content-Type"] = "application/json";
    }
    const lines: string[] = [
      `const response = await fetch("${resolvedUrl}", {`,
      `  method: "${terminalMethod}",`,
      `  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")},`,
    ];
    if (
      (terminalMethod === "POST" || terminalMethod === "PUT") &&
      requestBody &&
      requestBody.trim() !== "{}"
    ) {
      lines.push(
        `  body: JSON.stringify(${requestBody.replace(/\n/g, "\n  ")}),`,
      );
    }
    lines.push("});");
    lines.push("const data = await response.json();");
    lines.push("console.log(data);");
    return lines.join("\n");
  }, [terminalMethod, resolvedUrl, currentToken, requestBody]);

  const copyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Real Execute Request
  const executeRequest = async () => {
    setIsExecuting(true);
    setActiveFormat("response");
    const startTime = performance.now();

    try {
      let finalPath = terminalEndpoint;
      if (finalPath.includes(":id")) {
        const idToUse = docId.trim() || "sample-id";
        finalPath = finalPath.replace(":id", idToUse);
      }
      const apiPath = finalPath.startsWith("/api")
        ? finalPath
        : `/api${finalPath.startsWith("/") ? finalPath : `/${finalPath}`}`;

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (currentToken) {
        headers["token"] = currentToken;
      }
      if (terminalMethod === "POST" || terminalMethod === "PUT") {
        headers["Content-Type"] = "application/json";
      }

      let payload: any = undefined;
      if (
        (terminalMethod === "POST" || terminalMethod === "PUT") &&
        requestBody.trim()
      ) {
        try {
          payload = JSON.parse(requestBody);
        } catch (e: any) {
          throw new Error(`Invalid JSON in Request Body: ${e.message}`);
        }
      }

      const res = await fetch(apiPath, {
        method: terminalMethod,
        headers,
        body: payload !== undefined ? JSON.stringify(payload) : undefined,
      });

      const timeMs = Math.round(performance.now() - startTime);
      const contentType = res.headers.get("content-type");
      let resData: any;
      if (contentType && contentType.includes("application/json")) {
        resData = await res.json();
      } else {
        resData = await res.text();
      }

      setExecutionResult({
        status: res.status,
        statusText: res.statusText || (res.ok ? "OK" : "Error"),
        timeMs,
        data: resData,
      });
    } catch (err: any) {
      const timeMs = Math.round(performance.now() - startTime);
      setExecutionResult({
        status: 0,
        statusText: "Connection Error",
        timeMs,
        error: err.message || "Network error executing request",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const schemaFieldList = useMemo(() => {
    const s = activeResourceConfig.schema;
    if (!s || typeof s !== "object") return "None";
    return Object.keys(s).join(", ");
  }, [activeResourceConfig]);

  const ActiveIcon = getResourceIcon(activeResource);

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* SECTION 1: Core System Endpoints (Matching Feature Card Style) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="icon-badge">
                <Server size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                  Core System Endpoints
                </h4>
                <p className="card-desc" style={{ margin: "2px 0 0 0" }}>
                  Operational health checks and authentication endpoints.
                </p>
              </div>
            </div>
            <span
              className="badge"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 12,
                backgroundColor: "var(--bg-badge)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
              }}
            >
              System Routes
            </span>
          </div>

          <div
            className="table-container"
            style={{
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <table className="table table-hover" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 100, fontSize: 13, fontWeight: 700 }}>
                    Method
                  </th>
                  <th style={{ width: 220, fontSize: 13, fontWeight: 700 }}>
                    Route
                  </th>
                  <th style={{ fontSize: 13, fontWeight: 700 }}>Description</th>
                  <th style={{ width: 150, fontSize: 13, fontWeight: 700 }}>
                    Auth Scope
                  </th>
                  <th
                    style={{
                      width: 110,
                      textAlign: "right",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Try
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="method-tag method-tag-get">GET</span>
                  </td>
                  <td>
                    <code className="endpoint-badge">/ping</code>
                  </td>
                  <td style={{ fontSize: 13.5 }}>
                    Health check and server uptime latency
                  </td>
                  <td>
                    <span
                      className="badge badge-secondary"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "3px 8px",
                      }}
                    >
                      Public
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => selectEndpoint("GET", "/ping")}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title="Load /ping into developer console"
                    >
                      <Play size={12} /> Try
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="method-tag method-tag-post">POST</span>
                  </td>
                  <td>
                    <code className="endpoint-badge">/login</code>
                  </td>
                  <td style={{ fontSize: 13.5 }}>
                    Authenticate with credentials or direct token access
                  </td>
                  <td>
                    <span
                      className="badge badge-secondary"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "3px 8px",
                      }}
                    >
                      Public
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => selectEndpoint("POST", "/login")}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title="Load /login into developer console"
                    >
                      <Play size={12} /> Try
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="method-tag method-tag-get">GET</span>
                  </td>
                  <td>
                    <code className="endpoint-badge">/account</code>
                  </td>
                  <td style={{ fontSize: 13.5 }}>
                    Retrieve authenticated user profile and permissions
                  </td>
                  <td>
                    <span
                      className="badge badge-primary"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "3px 8px",
                      }}
                    >
                      Token Required
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => selectEndpoint("GET", "/account")}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title="Load /account into developer console"
                    >
                      <Play size={12} /> Try
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Core System footer */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Core Server Infrastructure &bull; High-Performance HTTP Engine
              </span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              4 system routes available &bull; Standard JSON payloads
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Dynamic Resource CRUD Endpoints (Tab Switcher + Single Unified Table) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="icon-badge">
                <FolderKanban size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                  Dynamic Resource CRUD Operations
                </h4>
                <p className="card-desc" style={{ margin: "2px 0 0 0" }}>
                  Select a business resource tab below to preview its schema and
                  single unified REST endpoint table.
                </p>
              </div>
            </div>
            <span
              className="badge"
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 10,
                backgroundColor: "var(--bg-badge)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
              }}
            >
              5 REST Operations
            </span>
          </div>

          {/* TAB INDICATOR SWITCHER */}
          <div className="docs-resource-tabs">
            {resources.map(([key, res]: [string, any]) => {
              const isActive = activeResource === key;
              const Icon = getResourceIcon(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectResource(key)}
                  className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    fontWeight: 600,
                    fontSize: 13,
                    padding: "6px 14px",
                    borderRadius: "var(--radius-btn)",
                  }}
                >
                  <Icon size={15} />
                  <span>{formatResourceTitle(key)}</span>
                  {res.admin && (
                    <span
                      className="badge badge-danger"
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        letterSpacing: "0.03em",
                      }}
                    >
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ACTIVE RESOURCE METADATA BANNER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              marginBottom: 12,
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              fontSize: 13.5,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ActiveIcon size={16} className="text-primary" />
              <span>
                Active Resource:{" "}
                <strong style={{ fontWeight: 700, fontSize: 14 }}>
                  {formatResourceTitle(activeResource)}
                </strong>
              </span>
              <span className="text-muted" style={{ marginLeft: 8 }}>
                Permitted Schema Fields: <code>{schemaFieldList}</code>
              </span>
            </div>
            {activeResourceConfig.admin && (
              <span className="badge badge-danger">Requires Admin Token</span>
            )}
          </div>

          {/* SINGLE UNIFIED TABLE FOR SELECTED RESOURCE */}
          <div
            className="table-container"
            style={{
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <table className="table table-hover" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 100, fontSize: 13, fontWeight: 700 }}>
                    Method
                  </th>
                  <th style={{ width: 260, fontSize: 13, fontWeight: 700 }}>
                    Endpoint
                  </th>
                  <th style={{ fontSize: 13, fontWeight: 700 }}>
                    Action & Description
                  </th>
                  <th
                    style={{
                      width: 110,
                      textAlign: "right",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Console
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="method-tag method-tag-get">GET</span>
                  </td>
                  <td>
                    <code className="endpoint-badge">/{activeResource}</code>
                  </td>
                  <td style={{ fontSize: 13.5 }}>
                    List & query documents with optional filter parameters
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() =>
                        selectEndpoint("GET", `/${activeResource}`)
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title={`Run GET /${activeResource} in console`}
                    >
                      <Play size={12} /> Try
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="method-tag method-tag-post">POST</span>
                  </td>
                  <td>
                    <code className="endpoint-badge">/{activeResource}</code>
                  </td>
                  <td style={{ fontSize: 13.5 }}>
                    Create a new record validated against resource schema
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() =>
                        selectEndpoint("POST", `/${activeResource}`)
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title={`Run POST /${activeResource} in console`}
                    >
                      <Play size={12} /> Try
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="method-tag method-tag-get">GET</span>
                  </td>
                  <td>
                    <code className="endpoint-badge">
                      /{activeResource}/:id
                    </code>
                  </td>
                  <td style={{ fontSize: 13.5 }}>
                    Retrieve a single document by unique ObjectID
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() =>
                        selectEndpoint("GET", `/${activeResource}/:id`, true)
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title={`Run GET /${activeResource}/:id in console`}
                    >
                      <Play size={12} /> Try
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="method-tag method-tag-put">PUT</span>
                  </td>
                  <td>
                    <code className="endpoint-badge">
                      /{activeResource}/:id
                    </code>
                  </td>
                  <td style={{ fontSize: 13.5 }}>
                    Update document fields matching schema whitelist
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() =>
                        selectEndpoint("PUT", `/${activeResource}/:id`, true)
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title={`Run PUT /${activeResource}/:id in console`}
                    >
                      <Play size={12} /> Try
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="method-tag method-tag-delete">DELETE</span>
                  </td>
                  <td>
                    <code className="endpoint-badge">
                      /{activeResource}/:id
                    </code>
                  </td>
                  <td style={{ fontSize: 13.5 }}>
                    Permanently remove record from resource
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() =>
                        selectEndpoint("DELETE", `/${activeResource}/:id`, true)
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title={`Run DELETE /${activeResource}/:id in console`}
                    >
                      <Play size={12} /> Try
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Dynamic Resource footer */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Dynamic Document Schema Engine &bull; Asynchronous Event Bus
              </span>
            </div>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Active resource:{" "}
              <strong style={{ color: "var(--text-color)" }}>
                {formatResourceTitle(activeResource)}
              </strong>{" "}
              &bull; Permitted fields: <code>{schemaFieldList}</code>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Interactive Developer Code Exec Terminal & cURL Generator */}
      <div id="dev-terminal" className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="icon-badge">
                <Terminal size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                  REST API Terminal & cURL Generator
                </h4>
                <p className="card-desc" style={{ margin: "2px 0 0 0" }}>
                  Interactive live execution console with ready-to-run cURL and
                  Fetch snippets.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={executeRequest}
                disabled={isExecuting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {isExecuting ? (
                  <RefreshCw size={14} className="spin" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
                <span>{isExecuting ? "Executing..." : "Execute Request"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Request Builder Controls */}
          <div className="docs-request-builder">
            {/* Method Select */}
            <div style={{ display: "flex", gap: 5 }}>
              {(["GET", "POST", "PUT", "DELETE"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTerminalMethod(m)}
                  className="btn btn-xs"
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    padding: "4px 11px",
                    borderRadius: 5,
                    letterSpacing: "0.03em",
                    backgroundColor:
                      terminalMethod === m
                        ? m === "GET"
                          ? "#10b981"
                          : m === "POST"
                            ? "#3b82f6"
                            : m === "PUT"
                              ? "#f59e0b"
                              : "#ef4444"
                        : "var(--bg-card)",
                    color:
                      terminalMethod === m ? "#ffffff" : "var(--text-color)",
                    borderColor:
                      terminalMethod === m
                        ? "transparent"
                        : "var(--border-color)",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Endpoint Input */}
            <div className="input-group">
              <span
                className="input-addon"
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  backgroundColor: "var(--bg-card)",
                }}
              >
                {apiBaseUrl}
              </span>
              <input
                type="text"
                className="input"
                value={terminalEndpoint}
                onChange={(e) => setTerminalEndpoint(e.target.value)}
                placeholder="/resource"
                style={{ fontFamily: "monospace", fontSize: 13.5 }}
              />
            </div>

            {/* Optional ID Input if endpoint has :id */}
            {terminalEndpoint.includes(":id") && (
              <input
                type="text"
                className="input"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                placeholder="Document ObjectID..."
                style={{
                  width: 170,
                  fontFamily: "monospace",
                  fontSize: 13,
                }}
              />
            )}
          </div>

          {/* Optional JSON Body Editor for POST / PUT */}
          {(terminalMethod === "POST" || terminalMethod === "PUT") && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                <span>JSON Request Body</span>
                <span className="text-muted" style={{ fontWeight: 400 }}>
                  Schema-driven payload
                </span>
              </label>
              <textarea
                className="textarea"
                rows={4}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {/* MacOS-Style Developer Terminal Container */}
          <div className="docs-terminal">
            {/* Terminal Header Bar */}
            <div className="docs-terminal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="docs-terminal-dots">
                  <span className="docs-terminal-dot dot-red" />
                  <span className="docs-terminal-dot dot-yellow" />
                  <span className="docs-terminal-dot dot-green" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Code2 size={15} style={{ color: "#89b4fa" }} />
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#cdd6f4" }}
                  >
                    terminal@core-api
                  </span>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setActiveFormat("curl")}
                  className="btn btn-xs"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 8px",
                    backgroundColor:
                      activeFormat === "curl" ? "#313244" : "transparent",
                    color: activeFormat === "curl" ? "#ffffff" : "#a6adc8",
                    borderColor:
                      activeFormat === "curl" ? "#45475a" : "transparent",
                  }}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormat("fetch")}
                  className="btn btn-xs"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 8px",
                    backgroundColor:
                      activeFormat === "fetch" ? "#313244" : "transparent",
                    color: activeFormat === "fetch" ? "#ffffff" : "#a6adc8",
                    borderColor:
                      activeFormat === "fetch" ? "#45475a" : "transparent",
                  }}
                >
                  JavaScript Fetch
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormat("response")}
                  className="btn btn-xs"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 8px",
                    backgroundColor:
                      activeFormat === "response" ? "#313244" : "transparent",
                    color: activeFormat === "response" ? "#a6e3a1" : "#a6adc8",
                    borderColor:
                      activeFormat === "response" ? "#45475a" : "transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>Response</span>
                  {executionResult && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor:
                          executionResult.status &&
                          executionResult.status >= 200 &&
                          executionResult.status < 300
                            ? "#a6e3a1"
                            : "#f38ba8",
                        display: "inline-block",
                      }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyCode(
                      activeFormat === "curl"
                        ? curlSnippet
                        : activeFormat === "fetch"
                          ? fetchSnippet
                          : JSON.stringify(
                              executionResult?.data || executionResult,
                              null,
                              2,
                            ),
                    )
                  }
                  className="btn btn-xs"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 8px",
                    backgroundColor: "#313244",
                    color: copied ? "#a6e3a1" : "#cdd6f4",
                    borderColor: "#45475a",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginLeft: 6,
                  }}
                  title="Copy snippet to clipboard"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Terminal Body Content */}
            <div style={{ padding: 18, minHeight: 140 }}>
              {activeFormat === "curl" ? (
                <pre
                  style={{
                    margin: 0,
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    color: "#89b4fa",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {curlSnippet}
                </pre>
              ) : activeFormat === "fetch" ? (
                <pre
                  style={{
                    margin: 0,
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    color: "#f9e2af",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {fetchSnippet}
                </pre>
              ) : (
                <div>
                  {isExecuting ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: "#a6adc8",
                        padding: "20px 0",
                      }}
                    >
                      <RefreshCw size={16} className="spin" />
                      <span>Sending HTTP request to backend...</span>
                    </div>
                  ) : executionResult ? (
                    <div>
                      {/* Status summary pill */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 12,
                          paddingBottom: 10,
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          fontSize: 13,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              executionResult.status &&
                              executionResult.status >= 200 &&
                              executionResult.status < 300
                                ? "#a6e3a1"
                                : "#f38ba8",
                          }}
                        >
                          STATUS: {executionResult.status}{" "}
                          {executionResult.statusText}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#a6adc8",
                          }}
                        >
                          <Clock size={12} />
                          {executionResult.timeMs}ms
                        </span>
                        <button
                          type="button"
                          onClick={() => setExecutionResult(null)}
                          className="btn btn-xs"
                          style={{
                            marginLeft: "auto",
                            color: "#a6adc8",
                            padding: "2px 8px",
                            backgroundColor: "transparent",
                            borderColor: "transparent",
                            textDecoration: "none",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          padding: 0,
                          background: "transparent",
                          border: "none",
                          color:
                            executionResult.error ||
                            (executionResult.status &&
                              executionResult.status >= 400)
                              ? "#f38ba8"
                              : "#a6e3a1",
                          fontSize: 13.5,
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {JSON.stringify(
                          executionResult.data || {
                            error: executionResult.error,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "#6c7086",
                        fontSize: 13.5,
                        padding: "20px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Terminal size={16} />
                      <span>
                        No request executed yet. Click &quot;Execute
                        Request&quot; or select an endpoint above to run.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
